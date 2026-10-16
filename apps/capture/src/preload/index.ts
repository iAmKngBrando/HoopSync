import { contextBridge, ipcRenderer } from "electron";
import type { DatasetExample, SaveDatasetExampleInput } from "../main/dataset";
import type { AppendSessionFrameInput, SessionFrame, SessionSummary } from "../main/sessionRecording";
import type { ScreenTag } from "../main/tags";

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

  listTags: (): Promise<ScreenTag[]> => ipcRenderer.invoke("tags:list"),
  addTag: (name: string, description: string): Promise<ScreenTag[]> => ipcRenderer.invoke("tags:add", name, description),
  updateTagDescription: (name: string, description: string): Promise<ScreenTag[]> =>
    ipcRenderer.invoke("tags:update-description", name, description),
  renameTag: (name: string, newName: string): Promise<ScreenTag[]> =>
    ipcRenderer.invoke("tags:rename", name, newName),
  deleteTag: (name: string): Promise<ScreenTag[]> => ipcRenderer.invoke("tags:delete", name),

  startSession: (): Promise<SessionSummary> => ipcRenderer.invoke("session:start"),
  appendSessionFrame: (sessionId: string, input: AppendSessionFrameInput): Promise<SessionFrame> =>
    ipcRenderer.invoke("session:append-frame", sessionId, input),
  listSessions: (): Promise<SessionSummary[]> => ipcRenderer.invoke("session:list"),
  listSessionFrames: (sessionId: string): Promise<SessionFrame[]> =>
    ipcRenderer.invoke("session:list-frames", sessionId),
  discardSessionFrames: (sessionId: string, frameIds: string[]): Promise<void> =>
    ipcRenderer.invoke("session:discard-frames", sessionId, frameIds),
  discardSession: (sessionId: string): Promise<void> => ipcRenderer.invoke("session:discard", sessionId),
  commitSessionFrames: (sessionId: string, frameIds: string[], screenType: string): Promise<DatasetExample[]> =>
    ipcRenderer.invoke("session:commit-frames", sessionId, frameIds, screenType),
});
