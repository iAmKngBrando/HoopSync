// Owns the camera connection and live-tracking loop at the app level, not inside
// DeviceCapturePanel - that panel only renders while Settings is the active tab, and
// unmounting it (navigating to Live Dashboard, etc.) was tearing the connection and
// the frame-sending loop down with it. The actual decode/capture <video> lives here,
// always mounted (off-screen) regardless of which tab is showing; DeviceCapturePanel
// renders its own small preview <video> pointed at the same stream.

import { createContext, useContext, type ReactNode } from 'react';
import { useDeviceCapture, type DeviceCaptureControls } from './useDeviceCapture';
import { useLiveTracking, type LiveTrackingControls } from './useLiveTracking';

interface DeviceCaptureContextValue extends DeviceCaptureControls {
  tracking: LiveTrackingControls;
}

const DeviceCaptureContext = createContext<DeviceCaptureContextValue | null>(null);

export function DeviceCaptureProvider({ children }: { children: ReactNode }) {
  const capture = useDeviceCapture();
  const tracking = useLiveTracking(capture.videoRef);

  return (
    <DeviceCaptureContext.Provider value={{ ...capture, tracking }}>
      {/* Decode target for sendFrame/captureFrame - must stay mounted across tab
          switches, so it isn't rendered inside any single tab's view. */}
      <video ref={capture.videoRef} muted playsInline style={{ display: 'none' }} />
      {children}
    </DeviceCaptureContext.Provider>
  );
}

export function useDeviceCaptureContext(): DeviceCaptureContextValue {
  const ctx = useContext(DeviceCaptureContext);
  if (!ctx) throw new Error('useDeviceCaptureContext must be used within a DeviceCaptureProvider');
  return ctx;
}
