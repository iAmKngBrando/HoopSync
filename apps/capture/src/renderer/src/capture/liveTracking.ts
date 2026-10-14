import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// Mirrors 2kot-frame-capture's "Live tracking" mode (ContinuousCapture.tsx):
// POST a JPEG frame to apps/server's /api/frames/analyze at a fixed rate and
// surface whatever it reports back. The server (not this app) does the
// screen reading now - see the TS detection/parsing pipeline this replaced.
const SERVER_URL = "http://127.0.0.1:8787";
const SAMPLE_RATE_HZ = 2;

export type LiveTrackingStatus =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export interface LiveTrackingControls {
  running: boolean;
  status: LiveTrackingStatus;
  framesSent: number;
  start: () => void;
  stop: () => void;
}

export function useLiveTracking(videoRef: RefObject<HTMLVideoElement>): LiveTrackingControls {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<LiveTrackingStatus>({ kind: "idle" });
  const [framesSent, setFramesSent] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sendingRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  const sendFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return;
    // The server reads one frame at a time; skip while it's busy rather than
    // letting a backlog of in-flight requests build up.
    if (sendingRef.current) return;

    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    sendingRef.current = true;
    setStatus({ kind: "sending" });
    canvas.toBlob(
      async (blob) => {
        try {
          if (!blob) throw new Error("Could not encode frame");
          const body = new FormData();
          body.append("file", blob, "frame.jpg");
          body.append("captured_at", new Date().toISOString());
          const response = await fetch(`${SERVER_URL}/api/frames/analyze`, { method: "POST", body });
          if (!response.ok) throw new Error(`Server answered ${response.status}`);
          const result = await response.json();
          setFramesSent((n) => n + 1);
          setStatus({
            kind: "ok",
            message: result.game
              ? `Game recorded: ${result.game.your_score} - ${result.game.opponent_score}`
              : `Screen: ${result.kind} · session: ${result.session?.phase ?? "unknown"}`,
          });
        } catch (cause) {
          setStatus({
            kind: "error",
            message: cause instanceof Error ? cause.message : "Server not reachable. Is it running?",
          });
        } finally {
          sendingRef.current = false;
        }
      },
      "image/jpeg",
      0.9,
    );
  }, [videoRef]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setStatus({ kind: "idle" });
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current !== null) return;
    setRunning(true);
    setFramesSent(0);
    intervalRef.current = window.setInterval(sendFrame, 1000 / SAMPLE_RATE_HZ);
  }, [sendFrame]);

  // Stop sending if the component unmounts mid-session.
  useEffect(() => stop, [stop]);

  return { running, status, framesSent, start, stop };
}
