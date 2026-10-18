import { join } from "node:path";
import { app, BrowserWindow, ipcMain, session, shell, systemPreferences } from "electron";
import {
  deleteDatasetExample,
  listDatasetExamples,
  renameScreenType,
  saveDatasetExample,
  saveDatasetExampleFromFile,
  type SaveDatasetExampleInput,
} from "./dataset";
import {
  appendSessionFrame,
  discardSession,
  discardSessionFrames,
  listSessionFrames,
  listSessions,
  sessionFrameDataUrl,
  sessionFramePath,
  startSession,
  type AppendSessionFrameInput,
} from "./sessionRecording";
import { addTag, deleteTag, listTags, renameTag, updateTagDescription } from "./tags";

const CAMERA_PRIVACY_SETTINGS_URL = "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera";

// Repo-relative rather than app.getPath('userData') so the developer can browse/curate
// examples directly in Finder/the repo (Phase 2 goal - build a labeled frame dataset).
// Only valid for an unpacked dev run; revisit if/when this app is ever packaged.
function datasetDir(): string {
  return join(app.getAppPath(), "capture-samples");
}

// Scratch staging area for session recordings, kept separate from capture-samples so raw
// unlabeled dumps never mix with the curated dataset - see the record/review/commit flow.
function sessionRecordingsDir(): string {
  return join(app.getAppPath(), "session-recordings");
}

// Small, git-tracked config (not raw capture data) - the user-extensible tag registry.
function tagsDir(): string {
  return join(app.getAppPath(), "dataset-config");
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  // HoopSync capture is a single-purpose local app (not a general browser), so the
  // Elgato/webcam permission prompt is auto-approved at the Electron/Chromium level
  // rather than shown per-origin. On macOS this alone does NOT trigger the OS-level
  // camera TCC dialog, so it's requested explicitly below via systemPreferences.
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission !== "media") {
      callback(false);
      return;
    }
    if (process.platform !== "darwin") {
      callback(true);
      return;
    }
    systemPreferences
      .askForMediaAccess("camera")
      .then((granted) => callback(granted))
      .catch(() => callback(false));
  });

  ipcMain.handle("camera:get-status", () => {
    if (process.platform !== "darwin") return "granted";
    return systemPreferences.getMediaAccessStatus("camera");
  });

  ipcMain.handle("camera:open-privacy-settings", () => {
    if (process.platform === "darwin") shell.openExternal(CAMERA_PRIVACY_SETTINGS_URL);
  });

  ipcMain.handle("dataset:list", () => listDatasetExamples(datasetDir()));
  ipcMain.handle("dataset:save", (_event, input: SaveDatasetExampleInput) => saveDatasetExample(datasetDir(), input));
  ipcMain.handle("dataset:delete", (_event, id: string) => deleteDatasetExample(datasetDir(), id));

  ipcMain.handle("tags:list", () => listTags(tagsDir()));
  ipcMain.handle("tags:add", (_event, name: string, description: string) => addTag(tagsDir(), name, description));
  ipcMain.handle("tags:update-description", (_event, name: string, description: string) =>
    updateTagDescription(tagsDir(), name, description),
  );
  // Renaming a tag retargets the dataset too: the screenType dir + manifest entries
  // follow the new name, otherwise the examples would stop showing in the gallery.
  ipcMain.handle("tags:rename", async (_event, name: string, newName: string) => {
    const next = await renameTag(tagsDir(), name, newName);
    await renameScreenType(datasetDir(), name, newName.trim());
    return next;
  });
  ipcMain.handle("tags:delete", async (_event, name: string) => {
    const inUse = (await listDatasetExamples(datasetDir())).filter((e) => e.screenType === name).length;
    if (inUse > 0) {
      throw new Error(`"${name}" still labels ${inUse} dataset example(s) - delete those examples first`);
    }
    return deleteTag(tagsDir(), name);
  });

  ipcMain.handle("session:start", () => startSession(sessionRecordingsDir()));
  ipcMain.handle("session:append-frame", (_event, sessionId: string, input: AppendSessionFrameInput) =>
    appendSessionFrame(sessionRecordingsDir(), sessionId, input),
  );
  ipcMain.handle("session:list", () => listSessions(sessionRecordingsDir()));
  ipcMain.handle("session:list-frames", (_event, sessionId: string) =>
    listSessionFrames(sessionRecordingsDir(), sessionId),
  );
  ipcMain.handle("session:frame-image", (_event, sessionId: string, frameId: string) =>
    sessionFrameDataUrl(sessionRecordingsDir(), sessionId, frameId),
  );
  ipcMain.handle("session:discard-frames", (_event, sessionId: string, frameIds: string[]) =>
    discardSessionFrames(sessionRecordingsDir(), sessionId, frameIds),
  );
  ipcMain.handle("session:discard", (_event, sessionId: string) => discardSession(sessionRecordingsDir(), sessionId));
  ipcMain.handle(
    "session:commit-frames",
    async (_event, sessionId: string, frameIds: string[], screenType: string) => {
      const frames = await listSessionFrames(sessionRecordingsDir(), sessionId);
      const idSet = new Set(frameIds);
      const saved = [];
      for (const frame of frames) {
        if (!idSet.has(frame.id)) continue;
        saved.push(
          await saveDatasetExampleFromFile(datasetDir(), {
            sourcePath: sessionFramePath(sessionRecordingsDir(), sessionId, frame.filename),
            thumbnailDataUrl: frame.thumbnailDataUrl,
            screenType,
            source: "live",
            width: frame.width,
            height: frame.height,
          }),
        );
      }
      // Committed frames move into capture-samples/ - remove them from the session
      // staging area now that they've been copied, so re-review only shows what's left.
      await discardSessionFrames(sessionRecordingsDir(), sessionId, frameIds);
      return saved;
    },
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
