const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const isDev = process.env.ELECTRON_DEV === "true";
let nextProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const loadApp = (url) => {
    win.loadURL(url);
    if (isDev) win.webContents.openDevTools();
  };

  if (isDev) {
    loadApp("http://localhost:3000");
  } else {
    const nextPath = path.join(__dirname, "../node_modules/.bin/next");
    nextProcess = spawn("node", [nextPath, "start", "-p", "3000"], {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, NODE_ENV: "production" },
    });
    const tryLoad = () => {
      const req = http.get("http://localhost:3000", (res) => {
        if (res.statusCode === 200) loadApp("http://localhost:3000");
      });
      req.on("error", () => setTimeout(tryLoad, 500));
    };
    setTimeout(tryLoad, 2000);
  }

  win.setMenuBarVisibility(false);

  win.on("closed", () => {
    if (nextProcess) nextProcess.kill();
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
