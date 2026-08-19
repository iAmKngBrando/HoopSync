import type { CameraAccessStatus } from "./capture/types";

declare global {
  interface Window {
    hoopsync: {
      versions: { chrome: string; electron: string; node: string };
      getCameraAccessStatus: () => Promise<CameraAccessStatus>;
      openCameraPrivacySettings: () => Promise<void>;
    };
  }
}

export {};
