import type { useCapture } from "./capture/useCapture";

function formatFps(fps: number | null): string {
  return fps === null ? "—" : `${fps}fps`;
}

function formatMs(ms: number | null): string {
  return ms === null ? "—" : `${Math.round(ms)}ms`;
}

interface CaptureViewProps {
  capture: ReturnType<typeof useCapture>;
}

export function CaptureView({ capture }: CaptureViewProps) {
  const {
    devices,
    selectedDeviceId,
    status,
    error,
    resolution,
    sourceFps,
    captureFps,
    bufferStats,
    cameraAccessStatus,
  } = capture;

  return (
    <>
      {cameraAccessStatus === "denied" && (
        <section className="panel panel--warning">
          <p>
            <strong>Camera access is denied at the OS level</strong> — macOS won't show a permission dialog again
            until you re-enable it manually.
          </p>
          <button onClick={() => capture.openCameraPrivacySettings()}>Open Camera Privacy Settings</button>
        </section>
      )}
      {cameraAccessStatus === "restricted" && (
        <section className="panel panel--warning">
          <p>Camera access is restricted by a device policy (e.g. MDM/parental controls) and can't be enabled here.</p>
        </section>
      )}

      <section className="panel">
        <div className="panel__row">
          <label htmlFor="device-select">Capture device</label>
          <select
            id="device-select"
            value={selectedDeviceId ?? ""}
            onChange={(e) => capture.connect(e.target.value || null)}
          >
            <option value="" disabled>
              Select a device…
            </option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
          <button onClick={() => capture.refreshDevices()}>Refresh</button>
          {status === "CONNECTED" || status === "CONNECTING" ? (
            <button onClick={() => capture.disconnect()}>Disconnect</button>
          ) : (
            <button onClick={() => capture.connect(selectedDeviceId)}>Connect</button>
          )}
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="grid">
        <div className="panel panel--video">
          <h2>Live preview</h2>
          <video ref={capture.videoRef} muted playsInline />
        </div>

        <div className="panel">
          <h2>Diagnostics</h2>
          <dl className="diagnostics">
            <dt>Device</dt>
            <dd>{devices.find((d) => d.deviceId === selectedDeviceId)?.label ?? "—"}</dd>

            <dt>Resolution</dt>
            <dd>{resolution ? `${resolution.width}x${resolution.height}` : "—"}</dd>

            <dt>Source FPS</dt>
            <dd>{formatFps(sourceFps)}</dd>

            <dt>Capture FPS</dt>
            <dd>{formatFps(captureFps)}</dd>

            <dt>Buffer frames</dt>
            <dd>{bufferStats.count}</dd>

            <dt>Buffer span</dt>
            <dd>{formatMs(bufferStats.spanMs)}</dd>

            <dt>Oldest frame age</dt>
            <dd>{formatMs(bufferStats.oldestAgeMs)}</dd>
          </dl>
        </div>
      </section>

      <section className="panel">
        <h2>Rolling buffer ({bufferStats.count} frames)</h2>
        <div className="thumbnail-strip">
          {capture.recentThumbnails.length === 0 ? (
            <p className="muted">No frames captured yet.</p>
          ) : (
            capture.recentThumbnails.map((src, i) => <img key={i} src={src} alt={`Buffered frame ${i}`} />)
          )}
        </div>
      </section>
    </>
  );
}
