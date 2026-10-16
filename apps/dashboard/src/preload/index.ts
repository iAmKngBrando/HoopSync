import { contextBridge, ipcRenderer } from "electron";
import type { BoardCard, BoardColumn, BoardTagDef } from "../main/devBoard";

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
  devBoard: {
    list: (): Promise<BoardCard[]> => ipcRenderer.invoke("dev-board:list"),
    addCard: (title: string, note: string | undefined, tag: string | undefined, author: string | undefined): Promise<BoardCard[]> =>
      ipcRenderer.invoke("dev-board:add", title, note, tag, author),
    moveCard: (id: string, column: BoardColumn): Promise<BoardCard[]> => ipcRenderer.invoke("dev-board:move", id, column),
    deleteCard: (id: string): Promise<BoardCard[]> => ipcRenderer.invoke("dev-board:delete", id),
    listTags: (): Promise<BoardTagDef[]> => ipcRenderer.invoke("dev-board:list-tags"),
    addTag: (name: string): Promise<BoardTagDef[]> => ipcRenderer.invoke("dev-board:add-tag", name),
    renameTag: (name: string, newName: string): Promise<BoardTagDef[]> =>
      ipcRenderer.invoke("dev-board:rename-tag", name, newName),
    deleteTag: (name: string): Promise<BoardTagDef[]> => ipcRenderer.invoke("dev-board:delete-tag", name),
  },
});
