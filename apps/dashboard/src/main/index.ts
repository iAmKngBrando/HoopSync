import { join } from "node:path";
import { app, BrowserWindow, ipcMain, session, shell, systemPreferences } from "electron";

const CAMERA_PRIVACY_SETTINGS_URL = "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera";

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1536,
    height: 960,
    minWidth: 1100,
    minHeight: 700,
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
