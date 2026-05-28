const {
  app, BrowserWindow, ipcMain, screen,
  Tray, Menu, Notification, nativeImage, powerMonitor, dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const { autoUpdater } = require("electron-updater");

const APP_ID = "com.thiag.pomofoco";
const ICON = path.join(__dirname, "icon.png");

let win, tray, manualWin;

function createWindow() {
  const { width: screenW } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 268,
    height: 384,
    x: screenW - 288,
    y: 20,
    frame: false,
    transparent: true,
    resizable: true,
    minWidth: 220,
    minHeight: 300,
    alwaysOnTop: true,
    skipTaskbar: false,
    icon: ICON,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // mantem o timer preciso quando na bandeja
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");
  win.loadFile("index.html");
}

/* ---------- bandeja do sistema (tray) ---------- */
function showWin() {
  if (!win) return;
  win.show();
  win.focus();
}
function sendCmd(cmd) {
  if (win) win.webContents.send("tray:command", cmd);
}
function createTray() {
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip("Pomofoco");
  const menu = Menu.buildFromTemplate([
    { label: "Mostrar", click: showWin },
    { label: "Iniciar / Pausar", click: () => sendCmd("toggle") },
    { label: "Pular fase", click: () => sendCmd("skip") },
    { label: "Reiniciar", click: () => sendCmd("reset") },
    { type: "separator" },
    { label: "Sair", click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
  tray.on("click", showWin);
}

/* ---------- janela do manual ---------- */
function openManual() {
  if (manualWin && !manualWin.isDestroyed()) { manualWin.show(); manualWin.focus(); return; }
  manualWin = new BrowserWindow({
    width: 480,
    height: 660,
    title: "Pomofoco — Manual",
    backgroundColor: "#1b1d23",
    autoHideMenuBar: true,
    icon: ICON,
    webPreferences: { contextIsolation: true },
  });
  manualWin.setMenuBarVisibility(false);
  manualWin.loadFile("manual.html");
  manualWin.on("closed", () => { manualWin = null; });
}
ipcMain.on("manual:open", openManual);

/* ---------- IPC ---------- */
ipcMain.on("window:minimize", () => win && win.hide());   // minimizar -> bandeja
ipcMain.on("window:close", () => app.quit());
ipcMain.on("window:toggle-pin", (_e, pinned) => win && win.setAlwaysOnTop(pinned, "screen-saver"));

ipcMain.on("notify", (_e, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: true }).show();
  }
});

// Chamar atenção no fim da fase: funciona mesmo na bandeja / em tela cheia.
ipcMain.on("attention", () => {
  if (!win) return;
  if (!win.isVisible()) win.show();
  win.flashFrame(true);
});

ipcMain.on("tray:icon", (_e, dataUrl) => {
  if (tray && dataUrl) tray.setImage(nativeImage.createFromDataURL(dataUrl));
});
ipcMain.on("tray:tooltip", (_e, text) => tray && tray.setToolTip(text || "Pomofoco"));

ipcMain.handle("login-item:get", () => app.getLoginItemSettings().openAtLogin);
ipcMain.on("login-item:set", (_e, val) => app.setLoginItemSettings({ openAtLogin: !!val }));

// Sons personalizados: escolhe um arquivo de áudio e o copia pra pasta do app.
ipcMain.handle("sound:pick", async () => {
  const r = await dialog.showOpenDialog(win, {
    title: "Escolher som de alarme",
    filters: [{ name: "Áudio", extensions: ["mp3", "wav", "ogg", "m4a", "aac", "flac", "webm"] }],
    properties: ["openFile"],
  });
  if (r.canceled || !r.filePaths[0]) return null;
  const src = r.filePaths[0];
  const dir = path.join(app.getPath("userData"), "sounds");
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, Date.now() + "_" + path.basename(src));
  fs.copyFileSync(src, dest);
  return { id: String(Date.now()), name: path.basename(src).replace(/\.[^.]+$/, ""), url: pathToFileURL(dest).href };
});

/* ---------- ociosidade / bloqueio de tela ---------- */
function wireIdle() {
  powerMonitor.on("lock-screen", () => sendCmd("idle-pause"));
  powerMonitor.on("suspend", () => sendCmd("idle-pause"));
}

app.whenReady().then(() => {
  app.setAppUserModelId(APP_ID);
  createWindow();
  createTray();
  wireIdle();
  // Auto-update: checa releases no GitHub, baixa e avisa (instala ao sair).
  // No-op em dev / offline / sem release publicada.
  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
});

app.on("will-quit", () => {
  if (tray) tray.destroy();
});
app.on("window-all-closed", () => app.quit());
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
