const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("win", {
  minimize: () => ipcRenderer.send("window:minimize"),
  close: () => ipcRenderer.send("window:close"),
  togglePin: (pinned) => ipcRenderer.send("window:toggle-pin", pinned),

  notify: (title, body) => ipcRenderer.send("notify", { title, body }),
  attention: () => ipcRenderer.send("attention"),
  setTrayIcon: (dataUrl) => ipcRenderer.send("tray:icon", dataUrl),
  setTrayTooltip: (text) => ipcRenderer.send("tray:tooltip", text),
  setTrayMenu: (labels) => ipcRenderer.send("tray:menu", labels),

  setLoginItem: (val) => ipcRenderer.send("login-item:set", val),
  getLoginItem: () => ipcRenderer.invoke("login-item:get"),
  pickSound: () => ipcRenderer.invoke("sound:pick"),
  openManual: (lang) => ipcRenderer.send("manual:open", lang),

  onCommand: (cb) => ipcRenderer.on("tray:command", (_e, cmd) => cb(cmd)),
});
