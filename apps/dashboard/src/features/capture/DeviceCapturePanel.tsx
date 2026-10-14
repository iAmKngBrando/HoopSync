import { useEffect } from 'react';
import { Video, VideoOff } from 'lucide-react';
import { useDeviceCapture } from './useDeviceCapture';
import { useLiveTracking } from './useLiveTracking';
import { useTrackerDataContext } from '../tracker-data/TrackerDataContext';
import { Card, SectionHeader } from '../../components/ui/Card';
import { StatusIndicator } from '../../components/ui/StatusIndicator';

export function DeviceCapturePanel() {
  const capture = useDeviceCapture();
  const tracking = useLiveTracking(capture.videoRef);
  const { captureState } = useTrackerDataContext();

  useEffect(() => {
    capture.refreshDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connected = capture.status === 'connected';
  // Someone other than this panel (e.g. the capture app) is already streaming.
  const liveElsewhere = !tracking.running && (captureState === 'recording' || captureState === 'processing');

  return (
    <Card label="Capture device">
      <SectionHeader
        title="CAPTURE DEVICE"
        action={<StatusIndicator state={connected ? 'connected' : 'disconnected'} />}
      />
      <p className="mb-4 text-xs text-foreground-secondary">
        Connects straight from the dashboard — the separate capture app is only needed for
        recording/labelling training data, not for everyday live tracking.
      </p>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-inset border border-border-soft bg-background-secondary lg:w-72">
          <video ref={capture.videoRef} muted playsInline className="size-full object-cover" />
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <VideoOff size={22} />
              <span className="text-xs">No preview</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={capture.selectedDeviceId ?? ''}
              onChange={(e) => capture.connect(e.target.value || null)}
              className="min-w-0 flex-1 rounded-lg border border-border-muted bg-inset px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="" disabled>
                Select a device…
              </option>
              {capture.devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => capture.refreshDevices()}
              className="rounded-lg border border-border-muted px-3 py-2 text-xs font-semibold text-foreground-secondary transition-colors hover:text-foreground"
            >
              Refresh
            </button>
            {connected ? (
              <button
                type="button"
                onClick={capture.disconnect}
                className="rounded-lg border border-border-muted px-3 py-2 text-xs font-semibold text-foreground-secondary transition-colors hover:text-foreground"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => capture.connect(capture.selectedDeviceId)}
                disabled={capture.status === 'connecting'}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-background transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {capture.status === 'connecting' ? 'Connecting…' : 'Connect'}
              </button>
            )}
          </div>

          {capture.error && <p className="text-xs text-destructive">{capture.error}</p>}

          <div className="border-t border-border-soft pt-3">
            <div className="flex flex-wrap items-center gap-2">
              {tracking.running ? (
                <button
                  type="button"
                  onClick={tracking.stop}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
                >
                  <VideoOff size={14} /> Stop Live Tracking
                </button>
              ) : (
                <button
                  type="button"
                  onClick={tracking.start}
                  disabled={!connected}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-background transition-colors hover:bg-primary-hover disabled:opacity-40"
                >
                  <Video size={14} /> Start Live Tracking
                </button>
              )}
              <span className="text-xs text-muted-foreground">{tracking.framesSent} frames sent</span>
            </div>

            {liveElsewhere && (
              <p className="mt-2 text-xs text-warning">
                Already live — frames are streaming from elsewhere (e.g. the capture app).
              </p>
            )}

            <p className="mt-2 text-xs text-foreground-secondary">
              {tracking.status.kind === 'idle' && 'Idle'}
              {tracking.status.kind === 'sending' && 'Sending frame…'}
              {tracking.status.kind === 'ok' && tracking.status.message}
              {tracking.status.kind === 'error' && <span className="text-destructive">{tracking.status.message}</span>}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
