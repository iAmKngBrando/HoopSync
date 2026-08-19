/** Device connection states shown by the dashboard's device-status indicator (brief Section 22). */
export type DeviceStatus = "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR";

/** Mirrors macOS's systemPreferences.getMediaAccessStatus('camera') result (see src/preload/index.ts). */
export type CameraAccessStatus = "not-determined" | "granted" | "denied" | "restricted" | "unknown";
