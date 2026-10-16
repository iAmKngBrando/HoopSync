import { useCallback, useRef, useState, type RefObject } from "react";
import { captureFromVideo } from "./imageUtils";

// Configuration point - trade-off between catching short-lived screens (brief Section 7:
// some screens are visible only ~0.5-1s) and how many frames you have to triage
// afterward. 2fps is a reasonable starting default.
const SESSION_SAMPLE_FPS = 2;

// Give up after this many append failures in a row - a single transient IPC
// error shouldn't kill a recording, but a stalled counter shouldn't pretend
// frames are still being saved either.
const MAX_CONSECUTIVE_FAILURES = 5;

export function useSessionRecording(videoRef: RefObject<HTMLVideoElement>) {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const failuresRef = useRef(0);

  const start = useCallback(async () => {
    if (!window.hoopsync) return;
    const newSession = await window.hoopsync.startSession();
    setSessionId(newSession.id);
    setFrameCount(0);
    setError(null);
    failuresRef.current = 0;
    setIsRecording(true);

    intervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video) return;
      const image = captureFromVideo(video);
      if (!image) return;
      try {
        await window.hoopsync.appendSessionFrame(newSession.id, {
          imageDataUrl: image.fullDataUrl,
          thumbnailDataUrl: image.thumbnailDataUrl,
          width: image.width,
          height: image.height,
        });
        failuresRef.current = 0;
        setFrameCount((c) => c + 1);
      } catch (err) {
        failuresRef.current += 1;
        if (failuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
          if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRecording(false);
          setError(
            `Recording stopped: ${MAX_CONSECUTIVE_FAILURES} frames in a row failed to save ` +
              `(${err instanceof Error ? err.message : String(err)}). ` +
              "The session's saved frames are still reviewable below.",
          );
        }
      }
    }, 1000 / SESSION_SAMPLE_FPS);
  }, [videoRef]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
  }, []);

  return { isRecording, sessionId, frameCount, error, start, stop };
}
