// Browser-side capture device connection (getUserMedia), so the dashboard
// doesn't need the separate Electron capture app running to pick a device
// and preview it. Mirrors apps/capture's useCapture.ts, minus the Electron
// IPC (camera permission TCC priming) and rolling-buffer/dataset bits that
// app needs for its own dev-tooling purpose.

import { useCallback, useRef, useState, type RefObject } from "react";

export type DeviceCaptureStatus = "disconnected" | "connecting" | "connected" | "error";

export interface DeviceCaptureControls {
  videoRef: RefObject<HTMLVideoElement>;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  status: DeviceCaptureStatus;
  error: string | null;
  refreshDevices: () => Promise<void>;
  connect: (deviceId: string | null) => Promise<void>;
  disconnect: () => void;
}

export function useDeviceCapture(): DeviceCaptureControls {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [status, setStatus] = useState<DeviceCaptureStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === "videoinput"));
    } catch {
      // Most browsers only return labelled devices after permission is granted once -
      // retried after connect() below.
    }
  }, []);

  const disconnect = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("disconnected");
    setSelectedDeviceId(null);
  }, []);

  const connect = useCallback(
    async (deviceId: string | null) => {
      setStatus("connecting");
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            : { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        setSelectedDeviceId(track?.getSettings().deviceId ?? deviceId ?? null);
        setStatus("connected");
        await refreshDevices();
      } catch (cause) {
        setStatus("error");
        setError(cause instanceof Error ? cause.message : "Could not open the capture device");
      }
    },
    [refreshDevices],
  );

  return { videoRef, devices, selectedDeviceId, status, error, refreshDevices, connect, disconnect };
}
