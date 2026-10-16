interface SessionRecorderControlsProps {
  isRecording: boolean;
  frameCount: number;
  error?: string | null;
  captureStatus: "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR";
  onStart: () => void;
  onStop: () => void;
}

export function SessionRecorderControls({
  isRecording,
  frameCount,
  error,
  captureStatus,
  onStart,
  onStop,
}: SessionRecorderControlsProps) {
  return (
    <section className="panel">
      <h2>Record session</h2>
      <div className="panel__row">
        {isRecording ? (
          <button onClick={onStop} className="recording-active">
            Stop recording ({frameCount} frames)
          </button>
        ) : (
          <button onClick={onStart} disabled={captureStatus !== "CONNECTED"}>
            Start recording
          </button>
        )}
        {captureStatus !== "CONNECTED" && !isRecording && (
          <span className="muted">Connect a device on the Capture tab first.</span>
        )}
        {!isRecording && <span className="muted">Samples ~2 frames/sec while recording - review and label afterward below.</span>}
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
