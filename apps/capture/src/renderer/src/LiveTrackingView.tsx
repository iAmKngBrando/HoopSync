import type { RefObject } from "react";
import { useLiveTracking } from "./capture/liveTracking";

interface LiveTrackingViewProps {
  videoRef: RefObject<HTMLVideoElement>;
  captureConnected: boolean;
}

export function LiveTrackingView({ videoRef, captureConnected }: LiveTrackingViewProps) {
  const tracking = useLiveTracking(videoRef);
  const liveElsewhere = !tracking.running && (tracking.remoteState === "recording" || tracking.remoteState === "processing");

  return (
    <section className="panel">
      <h2>Live tracking</h2>
      <p className="muted">
        Streams the connected capture device to the HoopSync server (apps/server) for live screen
        reading and session tracking, the same way the dashboard's Live Dashboard and OT Analytics
        get their data. Start it with <code>pnpm dev:server</code>. The dashboard's own Settings &gt;
        Capture Device panel can do this too - both read/write the same server state, so whichever
        one is streaming, the other will show it as connected.
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
        {liveElsewhere && <p className="muted">Already live - frames are streaming from elsewhere (e.g. the dashboard).</p>}
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
