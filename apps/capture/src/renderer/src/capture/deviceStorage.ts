const DEVICE_ID_STORAGE_KEY = "hoopsync-capture-device-id";

export function loadDeviceId(): string | null {
  try {
    return localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveDeviceId(deviceId: string): void {
  try {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  } catch {
    // localStorage may be unavailable (quota, disabled) - selection just won't persist.
  }
}
