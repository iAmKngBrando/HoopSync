import type { RefObject } from "react";
import { useLiveTracking } from "./capture/liveTracking";

interface LiveTrackingViewProps {
  videoRef: RefObject<HTMLVideoElement>;
  captureConnected: boolean;
}

export function LiveTrackingView({ videoRef, captureConnected }: LiveTrackingViewProps) {
  const tracking = useLiveTracking(videoRef);

  return (
    <section className="panel">
      <h2>Live tracking</h2>
      <p className="muted">
        Streams the connected capture device to the HoopSync server (apps/server) for live screen
        reading and session tracking, the same way the dashboard's Live Dashboard and OT Analytics
        get their data. Start it with <code>pnpm dev:server</code>.
      </p>

      <div className="panel__row">
        {tracking.running ? (
          <button onClick={() => tracking.stop()}>Stop Live Tracking</button>
        ) : (
          <button onClick={() => tracking.start()} disabled={!captureConnected}>
            Start Live Tracking
          </button>
        )}
        {!captureConnected && <p className="muted">Connect a capture device on the Capture tab first.</p>}
      </div>

      <dl className="diagnostics">
        <dt>Status</dt>
        <dd>
          {tracking.status.kind === "idle" && "Idle"}
          {tracking.status.kind === "sending" && "Sending frame…"}
          {tracking.status.kind === "ok" && tracking.status.message}
          {tracking.status.kind === "error" && <span className="error">{tracking.status.message}</span>}
        </dd>

        <dt>Frames sent</dt>
        <dd>{tracking.framesSent}</dd>
      </dl>
    </section>
  );
}
