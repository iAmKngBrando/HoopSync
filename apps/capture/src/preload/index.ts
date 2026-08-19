import { contextBridge, ipcRenderer } from "electron";
import type { DatasetExample, SaveDatasetExampleInput } from "../main/dataset";

const versions = {
  chrome: process.versions.chrome,
  electron: process.versions.electron,
  node: process.versions.node,
};

/** macOS camera TCC authorization status - see systemPreferences.getMediaAccessStatus. */
export type CameraAccessStatus = "not-determined" | "granted" | "denied" | "restricted" | "unknown";

contextBridge.exposeInMainWorld("hoopsync", {
  versions,
  getCameraAccessStatus: (): Promise<CameraAccessStatus> => ipcRenderer.invoke("camera:get-status"),
  openCameraPrivacySettings: (): Promise<void> => ipcRenderer.invoke("camera:open-privacy-settings"),
  listDatasetExamples: (): Promise<DatasetExample[]> => ipcRenderer.invoke("dataset:list"),
  saveDatasetExample: (input: SaveDatasetExampleInput): Promise<DatasetExample> =>
    ipcRenderer.invoke("dataset:save", input),
  deleteDatasetExample: (id: string): Promise<void> => ipcRenderer.invoke("dataset:delete", id),
});
