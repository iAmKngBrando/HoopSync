import type { CameraAccessStatus } from "./capture/types";
import type { DatasetExample, SaveDatasetExampleInput } from "./dataset/types";

declare global {
  interface Window {
    hoopsync: {
      versions: { chrome: string; electron: string; node: string };
      getCameraAccessStatus: () => Promise<CameraAccessStatus>;
      openCameraPrivacySettings: () => Promise<void>;
      listDatasetExamples: () => Promise<DatasetExample[]>;
      saveDatasetExample: (input: SaveDatasetExampleInput) => Promise<DatasetExample>;
      deleteDatasetExample: (id: string) => Promise<void>;
    };
  }
}

export {};
