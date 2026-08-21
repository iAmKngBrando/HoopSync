import { useCallback, useRef, useState, type RefObject } from "react";
import { captureFromVideo } from "./imageUtils";

// Configuration point - trade-off between catching short-lived screens (brief Section 7:
// some screens are visible only ~0.5-1s) and how many frames you have to triage
// afterward. 2fps is a reasonable starting default.
const SESSION_SAMPLE_FPS = 2;

export function useSessionRecording(videoRef: RefObject<HTMLVideoElement>) {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const start = useCallback(async () => {
    if (!window.hoopsync) return;
    const newSession = await window.hoopsync.startSession();
    setSessionId(newSession.id);
    setFrameCount(0);
    setIsRecording(true);

    intervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video) return;
      const image = captureFromVideo(video);
      if (!image) return;
      await window.hoopsync.appendSessionFrame(newSession.id, {
        imageDataUrl: image.fullDataUrl,
        thumbnailDataUrl: image.thumbnailDataUrl,
        width: image.width,
        height: image.height,
      });
      setFrameCount((c) => c + 1);
    }, 1000 / SESSION_SAMPLE_FPS);
  }, [videoRef]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
  }, []);

  return { isRecording, sessionId, frameCount, start, stop };
}
