import { join } from "node:path";
import { app, BrowserWindow, ipcMain, powerSaveBlocker, session, shell, systemPreferences } from "electron";
import { addCard, addTag, deleteCard, deleteTag, listBoard, listTags, moveCard, renameTag, type BoardColumn } from "./devBoard";

const CAMERA_PRIVACY_SETTINGS_URL = "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera";

/**
 * references/dev-board.json, next to the product brief - checked into git so the lite
 * kanban (Settings -> Developer) syncs between co-developers via normal git push/pull,
 * same way the brief itself does. Dashboard's own app dir is apps/dashboard, two levels
 * below the repo root.
 */
function devBoardPath(): string {
  return join(app.getAppPath(), "..", "..", "references", "dev-board.json");
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1536,
    height: 960,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      // See apps/capture/src/main/index.ts's comment on this same setting - this
      // window's own live-tracking capture is subject to the identical background
      // throttling issue while it sits unfocused during a real game.
      backgroundThrottling: false,
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
  // See apps/capture/src/main/index.ts's comment on this call - backgroundThrottling
  // alone doesn't stop macOS App Nap from suspending this window's background work
  // (its own live-tracking capture) while it sits unfocused during a real game.
  powerSaveBlocker.start("prevent-app-suspension");

  // Same reasoning as apps/capture: auto-approve the Elgato/webcam permission
  // prompt at the Electron/Chromium level (this is a single-purpose app, not
  // a general browser), and separately prime the macOS camera TCC dialog
  // since the Chromium-level approval alone doesn't trigger it.
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

  ipcMain.handle("dev-board:list", () => listBoard(devBoardPath()));
  ipcMain.handle(
    "dev-board:add",
    (_event, title: string, note: string | undefined, tag: string | undefined, author: string | undefined) =>
      addCard(devBoardPath(), title, note, tag, author),
  );
  ipcMain.handle("dev-board:move", (_event, id: string, column: BoardColumn) => moveCard(devBoardPath(), id, column));
  ipcMain.handle("dev-board:delete", (_event, id: string) => deleteCard(devBoardPath(), id));
  ipcMain.handle("dev-board:list-tags", () => listTags(devBoardPath()));
  ipcMain.handle("dev-board:add-tag", (_event, name: string) => addTag(devBoardPath(), name));
  ipcMain.handle("dev-board:rename-tag", (_event, name: string, newName: string) =>
    renameTag(devBoardPath(), name, newName),
  );
  ipcMain.handle("dev-board:delete-tag", (_event, name: string) => deleteTag(devBoardPath(), name));

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
