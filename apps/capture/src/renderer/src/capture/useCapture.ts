import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { RingFrameBuffer, type FrameBufferStats } from "./frameBuffer";
import { loadDeviceId, saveDeviceId } from "./deviceStorage";
import { THUMBNAIL_WIDTH } from "./constants";
import type { CameraAccessStatus, DeviceStatus } from "./types";

// Configuration point (brief Section 7: "exact frame rate and buffer duration should be
// configurable"). A Settings page can expose these later; for the Phase 1 prototype
// they're constants.
const BUFFER_DURATION_MS = 2000;
const BUFFER_MAX_FRAMES = 40;
const TARGET_CAPTURE_FPS = 15;
const FPS_SAMPLE_WINDOW_MS = 1000;

export interface Resolution {
  width: number;
  height: number;
}

export interface CaptureState {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  status: DeviceStatus;
  error: string | null;
  resolution: Resolution | null;
  /** Frames/sec actually arriving from the source device, measured via requestVideoFrameCallback. */
  sourceFps: number | null;
  /** Frames/sec actually being sampled into the rolling buffer (<= TARGET_CAPTURE_FPS). */
  captureFps: number | null;
  bufferStats: FrameBufferStats;
  recentThumbnails: string[];
  /** macOS camera TCC status ("unknown" on other platforms / outside Electron). */
  cameraAccessStatus: CameraAccessStatus;
}

export interface CaptureControls {
  videoRef: RefObject<HTMLVideoElement>;
  refreshDevices: () => Promise<void>;
  connect: (deviceId: string | null) => Promise<void>;
  disconnect: () => void;
  openCameraPrivacySettings: () => void;
}

function pruneWindow(timestamps: number[], now: number): number[] {
  return timestamps.filter((t) => now - t <= FPS_SAMPLE_WINDOW_MS);
}

export function useCapture(): CaptureState & CaptureControls {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferRef = useRef(new RingFrameBuffer({ maxAgeMs: BUFFER_DURATION_MS, maxCount: BUFFER_MAX_FRAMES }));
  const rvfcHandleRef = useRef<number | null>(null);
  const captureIntervalRef = useRef<number | null>(null);
  const sourceFrameTimestampsRef = useRef<number[]>([]);
  const captureFrameTimestampsRef = useRef<number[]>([]);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(loadDeviceId);
  const [status, setStatus] = useState<DeviceStatus>("DISCONNECTED");
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [sourceFps, setSourceFps] = useState<number | null>(null);
  const [captureFps, setCaptureFps] = useState<number | null>(null);
  const [bufferStats, setBufferStats] = useState<FrameBufferStats>(bufferRef.current.stats());
  const [recentThumbnails, setRecentThumbnails] = useState<string[]>([]);
  const [cameraAccessStatus, setCameraAccessStatus] = useState<CameraAccessStatus>("unknown");

  const refreshCameraAccessStatus = useCallback(async () => {
    if (!window.hoopsync) return; // renderer opened outside Electron (e.g. dev-server smoke test)
    setCameraAccessStatus(await window.hoopsync.getCameraAccessStatus());
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === "videoinput"));
    } catch {
      // enumerateDevices can fail before permission has ever been granted - ignore, retried after connect().
    }
  }, []);

  const stopLoops = useCallback(() => {
    const video = videoRef.current;
    if (rvfcHandleRef.current !== null && video?.cancelVideoFrameCallback) {
      video.cancelVideoFrameCallback(rvfcHandleRef.current);
      rvfcHandleRef.current = null;
    }
    if (captureIntervalRef.current !== null) {
      window.clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    stopLoops();
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("DISCONNECTED");
    setResolution(null);
    setSourceFps(null);
    setCaptureFps(null);
    bufferRef.current.clear();
    setBufferStats(bufferRef.current.stats());
    setRecentThumbnails([]);
  }, [stopLoops]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return;

    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    const scale = THUMBNAIL_WIDTH / video.videoWidth;
    canvas.width = THUMBNAIL_WIDTH;
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const now = performance.now();
    captureFrameTimestampsRef.current = pruneWindow([...captureFrameTimestampsRef.current, now], now);
    setCaptureFps(captureFrameTimestampsRef.current.length);

    bufferRef.current.push({
      timestamp: now,
      thumbnail: canvas.toDataURL("image/jpeg", 0.7),
      width: canvas.width,
      height: canvas.height,
    });
    setBufferStats(bufferRef.current.stats());
    setRecentThumbnails(bufferRef.current.getAll().map((f) => f.thumbnail));
  }, []);

  const startLoops = useCallback(
    (video: HTMLVideoElement) => {
      if (typeof video.requestVideoFrameCallback === "function") {
        const onSourceFrame = () => {
          const now = performance.now();
          sourceFrameTimestampsRef.current = pruneWindow([...sourceFrameTimestampsRef.current, now], now);
          setSourceFps(sourceFrameTimestampsRef.current.length);
          rvfcHandleRef.current = video.requestVideoFrameCallback(onSourceFrame);
        };
        rvfcHandleRef.current = video.requestVideoFrameCallback(onSourceFrame);
      }

      captureIntervalRef.current = window.setInterval(captureFrame, 1000 / TARGET_CAPTURE_FPS);
    },
    [captureFrame],
  );

  const connect = useCallback(
    async (deviceId: string | null) => {
      setError(null);
      setStatus("CONNECTING");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: false,
        });
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const track = stream.getVideoTracks()[0];
        const settings = track?.getSettings();
        if (settings?.width && settings.height) {
          setResolution({ width: settings.width, height: settings.height });
        }
        if (settings?.deviceId) {
          setSelectedDeviceId(settings.deviceId);
          saveDeviceId(settings.deviceId);
        }

        setStatus("CONNECTED");
        startLoops(video);
        await refreshDevices(); // device labels only populate once permission has been granted
      } catch (err) {
        setStatus("ERROR");
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        await refreshCameraAccessStatus();
      }
    },
    [refreshDevices, refreshCameraAccessStatus, startLoops],
  );

  const openCameraPrivacySettings = useCallback(() => {
    window.hoopsync?.openCameraPrivacySettings();
  }, []);

  useEffect(() => {
    refreshDevices();
    refreshCameraAccessStatus();
    return () => {
      stopLoops();
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    };
    // Mount/unmount only - connect()/disconnect() are stable callbacks the caller invokes explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    devices,
    selectedDeviceId,
    status,
    error,
    resolution,
    sourceFps,
    captureFps,
    bufferStats,
    recentThumbnails,
    cameraAccessStatus,
    videoRef,
    refreshDevices,
    connect,
    disconnect,
    openCameraPrivacySettings,
  };
}
