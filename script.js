"use strict";

const BOOT_LOG = document.getElementById("bootLog");
const BOOT_SCREEN = document.getElementById("boot");
const DESKTOP = document.getElementById("desktop");
const DOCK_APPS = document.getElementById("dockApps");
const APP_LAUNCHER = document.getElementById("appLauncher");
const APP_LIST = document.getElementById("appList");
const APP_SEARCH = document.getElementById("appSearch");
const APP_STORE = document.getElementById("appStore");
const STORE_SEARCH = document.getElementById("storeSearch");
const APP_STORE_LIST = document.getElementById("appStoreList");
const WELCOME_SCREEN = document.getElementById("welcomeScreen");
const WELCOME_APPS = document.getElementById("welcomeApps");
const WELCOME_INSTALL_BTN = document.getElementById("welcomeInstallBtn");
const RESET_BTN = document.getElementById("resetBtn");
const CLOCK_WIDGET = document.getElementById("clockWidget");
const GLITCH_TOGGLE = document.getElementById("glitchToggle");
const CRASH_SCREEN = document.getElementById("crashScreen");
const CRASH_REVIVE_BTN = document.getElementById("crashReviveBtn");
const TERMINAL = document.getElementById("terminal");
const TERMINAL_OUTPUT = document.getElementById("terminalOutput");
const TERMINAL_INPUT = document.getElementById("terminalInput");
const FILE_MANAGER = document.getElementById("fileManager");
const FILE_SEARCH = document.getElementById("fileSearch");
const FILE_LIST = document.getElementById("fileList");
const HTML_EMULATOR = document.getElementById("htmlEmulator");
const HTML_EDITOR = document.getElementById("htmlEditor");
const HTML_SAVE_BTN = document.getElementById("htmlSaveBtn");
const HTML_PREVIEW = document.getElementById("htmlPreview");
const WINDOWS_CONTAINER = document.getElementById("windowsContainer");

// Storage keys
const STORAGE_KEY_FS = "barados_filesystem";
const STORAGE_KEY_SETTINGS = "barados_settings";
const STORAGE_KEY_APPS = "barados_installed_apps";
const STORAGE_KEY_PINNED = "barados_dock_pinned";
const STORAGE_KEY_RAM = "barados_ram_alloc";

const MAX_RAM_MB = 50;

// App definitions (id, name, icon url, iframe src if iframe app)
const APPS = [
  {
    id: "gmail",
    name: "Gmail",
    icon: "icons/gmail.png",
    iframeSrc: "https://mail.google.com/mail/u/0/#inbox",
    iframe: true,
  },
  {
    id: "googledrive",
    name: "Google Drive",
    icon: "icons/googledrive.png",
    iframeSrc: "https://drive.google.com/drive/my-drive",
    iframe: true,
  },
  {
    id: "googlemeet",
    name: "Google Meet",
    icon: "icons/googlemeet.png",
    iframeSrc: "https://meet.google.com",
    iframe: true,
  },
  {
    id: "googlechat",
    name: "Google Chat",
    icon: "icons/googlechat.png",
    iframeSrc: "https://chat.google.com",
    iframe: true,
  },
  {
    id: "googlekeep",
    name: "Google Keep",
    icon: "icons/googlekeep.png",
    iframeSrc: "https://keep.google.com",
    iframe: true,
  },
  {
    id: "googleslides",
    name: "Google Slides",
    icon: "icons/googleslides.png",
    iframeSrc: "https://slides.google.com",
    iframe: true,
  },
  {
    id: "googlesheets",
    name: "Google Sheets",
    icon: "icons/googlesheets.png",
    iframeSrc: "https://sheets.google.com",
    iframe: true,
  },
  {
    id: "googledocs",
    name: "Google Docs",
    icon: "icons/googledocs.png",
    iframeSrc: "https://docs.google.com",
    iframe: true,
  },
  {
    id: "googlenotebooklm",
    name: "Google NotebookLM",
    icon: "icons/googlenotebooklm.png",
    iframeSrc: "https://notebooklm.google.com",
    iframe: true,
  },
  {
    id: "manageaccount",
    name: "Manage Google Account",
    icon: "icons/manageaccount.png",
    iframeSrc: "https://myaccount.google.com",
    iframe: true,
    requireLogin: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "icons/youtube.png",
    iframeSrc: "https://youtube.com",
    iframe: true,
  },
];

// RAM allocation tracking
let ramUsed = 0;
let ramAllocations = {}; // { appId: ramUsedMB }

// File system simulation
let fileSystem = {};

// Installed apps
let installedApps = [];

// Dock pinned apps
let pinnedApps = [];

// Settings
let settings = {
  glitchEnabled: false,
  theme: "light",
  volume: 0.5,
};

// Boot sequence logs
const BOOT_STEPS = [
  { time: 0, text: ">> SYSTEM log : Booting" },
  { time: 1200, text: ">> SYSTEM IS BOOTING TO BARAD OS." },
  { time: 2000, text: ">> LOADING FILE SYSTEM" },
  { time: 3500, text: ">> LOADING INSTALLED APPS" },
  { time: 4500, text: ">> INITIALIZING UI" },
  { time: 5500, text: ">> SYSTEM READY" },
];

// Utility to save/load JSON in localStorage
function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function loadFromStorage(key, def = null) {
  let data = localStorage.getItem(key);
  if (!data) return def;
  try {
    return JSON.parse(data);
  } catch {
    return def;
  }
}

// Append text to boot log
function appendBootLog(text) {
  BOOT_LOG.textContent += text + "\n";
  BOOT_LOG.scrollTop = BOOT_LOG.scrollHeight;
}

// Start boot sequence
function startBoot() {
  BOOT_LOG.textContent = "";
  BOOT_SCREEN.style.display = "flex";

  let idx = 0;
  function nextStep() {
    if (idx >= BOOT_STEPS.length) {
      bootComplete();
      return;
    }
    appendBootLog(BOOT_STEPS[idx].text);
    idx++;
    if (idx < BOOT_STEPS.length) {
      setTimeout(nextStep, BOOT_STEPS[idx].time - BOOT_STEPS[idx - 1].time);
    }
  }
  nextStep();
}

// Boot complete, hide boot screen, show desktop & load state
function bootComplete() {
  BOOT_SCREEN.style.display = "none";
  DESKTOP.style.display = "block";
  loadFileSystem();
  loadInstalledApps();
  loadSettings();
  renderDock();
  renderAppLauncher();
  updateClock();
  setInterval(updateClock, 1000);
  checkFirstBoot();
}

// Update clock widget in real-time
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
  CLOCK_WIDGET.textContent = timeStr;
}

// Load wallpaper from localStorage or default 'a.jpg'
function loadWallpaper() {
  let wallpaper = loadFromStorage("barados_wallpaper") || "a.jpg";
  document.body.style.backgroundImage = `url('${wallpaper}')`;
}

// Render dock icons
function renderDock() {
  DOCK_APPS.innerHTML = "";
  pinnedApps.forEach(appId => {
    const app = APPS.find(a => a.id === appId);
    if (!app) return;
    const icon = document.createElement("div");
    icon.className = "dock-icon";
    icon.style.backgroundImage = `url('${app.icon}')`;
    icon.title = app.name;
    icon.dataset.appid = app.id;
    icon.addEventListener("click", () => openApp(app.id));
    icon.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showDockContextMenu(e.pageX, e.pageY, app.id);
    });
    DOCK_APPS.appendChild(icon);
  });
}

// Render app launcher list (searchable)
function renderAppLauncher() {
  APP_LIST.innerHTML = "";
  const searchTerm = APP_SEARCH.value.trim().toLowerCase();
  APPS.forEach(app => {
    if (searchTerm && !app.name.toLowerCase().includes(searchTerm)) return;
    const appDiv = document.createElement("div");
    appDiv.className = "app-item";
    appDiv.style.backgroundImage = `url('${app.icon}')`;
    appDiv.title = app.name;
    appDiv.dataset.appid = app.id;
    appDiv.addEventListener("click", () => openApp(app.id));
    appDiv.addEventListener("contextmenu", e => {
      e.preventDefault();
      showLauncherContextMenu(e.pageX, e.pageY, app.id);
    });
    APP_LIST.appendChild(appDiv);
  });
}

// Event: Search in app launcher
APP_SEARCH.addEventListener("input", () => renderAppLauncher());

// Event: Open app launcher toggle (for demo, just a keyboard shortcut)
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    APP_LAUNCHER.style.display = "none";
  }
  if (e.key === "Meta" || e.key === "Control") {
    APP_LAUNCHER.style.display = "flex";
    APP_SEARCH.focus();
  }
});

// Open app window
function openApp(appId) {
  if (!installedApps.includes(appId)) {
    alert("App not installed. Please install it from the App Store.");
    return;
  }
  createWindowForApp(appId);
  addRamUsage(appId);
  playSound("open");
}

// Show dock context menu: pin/unpin
function showDockContextMenu(x, y, appId) {
  closeContextMenus();
  const menu = document.createElement("div");
  menu.className = "context-menu";
  const unpin = document.createElement("div");
  unpin.className = "context-menu-item";
  unpin.textContent = "Unpin from Dock";
  unpin.onclick = () => {
    pinnedApps = pinnedApps.filter(id => id !== appId);
    saveToStorage(STORAGE_KEY_PINNED, pinnedApps);
    renderDock();
    closeContextMenus();
  };
  menu.appendChild(unpin);
  document.body.appendChild(menu);
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
}

// Show launcher context menu: pin/unpin
function showLauncherContextMenu(x, y, appId) {
  closeContextMenus();
  const menu = document.createElement("div");
  menu.className = "context-menu";
  const isPinned = pinnedApps.includes(appId);
  const pinUnpin = document.createElement("div");
  pinUnpin.className = "context-menu-item";
  pinUnpin.textContent = isPinned ? "Unpin from Dock" : "Pin to Dock";
  pinUnpin.onclick = () => {
    if (isPinned) {
      pinnedApps = pinnedApps.filter(id => id !== appId);
    } else {
      pinnedApps.push(appId);
    }
    saveToStorage(STORAGE_KEY_PINNED, pinnedApps);
    renderDock();
    closeContextMenus();
  };
  menu.appendChild(pinUnpin);
  document.body.appendChild(menu);
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
}

// Close any open context menus
function closeContextMenus() {
  document.querySelectorAll(".context-menu").forEach(menu => menu.remove());
}

// Click anywhere closes context menus
document.addEventListener("click", closeContextMenus);

// Load file system from localStorage
function loadFileSystem() {
  fileSystem = loadFromStorage(STORAGE_KEY_FS, {});
}

// Load installed apps list
function loadInstalledApps() {
  installedApps = loadFromStorage(STORAGE_KEY_APPS, []);
}

// Load settings (glitch toggle, theme, etc)
function loadSettings() {
  const s = loadFromStorage(STORAGE_KEY_SETTINGS, {});
  settings = { ...settings, ...s };
  GLITCH_TOGGLE.checked = settings.glitchEnabled;
  GLITCH_TOGGLE.addEventListener("change", () => {
    settings.glitchEnabled = GLITCH_TOGGLE.checked;
    saveToStorage(STORAGE_KEY_SETTINGS, settings);
    startGlitchTimer();
  });
  loadWallpaper();
  pinnedApps = loadFromStorage(STORAGE_KEY_PINNED, []);
}

// Initialize the OS on page load
window.onload = () => {
  startBoot();
};

// Manage multiple windows and z-index stacking
const windows = [];

function createWindowForApp(appId) {
  const app = APPS.find(a => a.id === appId);
  if (!app) return;

  const win = document.createElement("div");
  win.className = "window liquid-glass";
  win.style.top = `${50 + windows.length * 30}px`;
  win.style.left = `${50 + windows.length * 30}px`;
  win.style.zIndex = 100 + windows.length;
  win.style.width = "600px";
  win.style.height = "450px";
  win.style.display = "flex";
  win.style.flexDirection = "column";

  // Title bar
  const titleBar = document.createElement("div");
  titleBar.style.cursor = "move";
  titleBar.style.padding = "6px 10px";
  titleBar.style.background = "rgba(255 255 255 / 0.12)";
  titleBar.style.borderBottom = "1px solid rgba(255 255 255 / 0.2)";
  titleBar.style.userSelect = "none";
  titleBar.textContent = app.name;

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.float = "right";
  closeBtn.style.margin = "0 0 0 10px";
  closeBtn.onclick = () => {
    document.body.removeChild(win);
    removeRamUsage(appId);
    playSound("close");
  };

  titleBar.appendChild(closeBtn);
  win.appendChild(titleBar);

  // Content area
  const content = document.createElement("div");
  content.style.flex = "1";
  content.style.overflow = "auto";
  content.style.padding = "10px";
  content.style.background = "rgba(255 255 255 / 0.06)";
  content.style.borderRadius = "10px";

  if (app.iframe) {
    const iframe = document.createElement("iframe");
    iframe.src = app.iframeSrc;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    content.appendChild(iframe);
  } else if (app.id === "htmlEmulator") {
    setupHTMLEmulator(content);
  } else {
    content.textContent = `App ${app.name} content goes here.`;
  }

  win.appendChild(content);
  document.body.appendChild(win);

  // Make window draggable
  makeDraggable(win, titleBar);

  windows.push(win);
}

// Draggable windows helper
function makeDraggable(element, handle) {
  let offsetX = 0, offsetY = 0, isDragging = false;

  handle.addEventListener("mousedown", e => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    element.style.zIndex = 10000;
  });

  window.addEventListener("mousemove", e => {
    if (!isDragging) return;
    element.style.left = `${e.clientX - offsetX}px`;
    element.style.top = `${e.clientY - offsetY}px`;
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      element.style.zIndex = 100 + windows.length;
    }
  });
}

// RAM allocation & crash system
function addRamUsage(appId) {
  const ramUsedByApp = 2.1; // MB per app
  if (ramUsed + ramUsedByApp > MAX_RAM_MB) {
    systemCrash();
    return;
  }
  ramUsed += ramUsedByApp;
  ramAllocations[appId] = (ramAllocations[appId] || 0) + ramUsedByApp;
  saveToStorage(STORAGE_KEY_RAM, ramAllocations);
}

function removeRamUsage(appId) {
  if (ramAllocations[appId]) {
    ramUsed -= ramAllocations[appId];
    delete ramAllocations[appId];
    saveToStorage(STORAGE_KEY_RAM, ramAllocations);
  }
}

function systemCrash() {
  CRASH_SCREEN.style.display = "flex";
  DESKTOP.style.display = "none";
  APP_LAUNCHER.style.display = "none";
  // Close all windows
  windows.forEach(w => w.remove());
  windows.length = 0;
  ramUsed = 0;
  ramAllocations = {};
}

// Crash screen revive button
CRASH_REVIVE_BTN.onclick = () => {
  const password = prompt("Enter GUI Password Manager Password:");
  if (password === "revivepassword") {  // Change this to whatever password you want
    CRASH_SCREEN.style.display = "none";
    DESKTOP.style.display = "block";
    startBoot();

    // Open a small terminal window that says "SYSTEM CRASHED. YOU REVIVED YOUR OS"
    createTerminalWindow("SYSTEM CRASHED.\nYOU REVIVED YOUR OS.");

    // Reset RAM usage so OS can run normally after crash
    ramUsed = 0;
    ramAllocations = {};
    saveToStorage(STORAGE_KEY_RAM, ramAllocations);

  } else {
    alert("Wrong password!");
  }
};

// Helper function to open terminal window with message
function createTerminalWindow(initialMessage = "") {
  const win = document.createElement("div");
  win.className = "window liquid-glass";
  win.style.width = "400px";
  win.style.height = "200px";
  win.style.top = "100px";
  win.style.left = "100px";
  win.style.zIndex = 9999;

  const titleBar = document.createElement("div");
  titleBar.textContent = "Terminal - Crash Manager";
  titleBar.style.background = "rgba(255 255 255 / 0.12)";
  titleBar.style.padding = "5px 10px";
  titleBar.style.cursor = "move";
  titleBar.style.userSelect = "none";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.float = "right";
  closeBtn.onclick = () => {
    document.body.removeChild(win);
  };
  titleBar.appendChild(closeBtn);
  win.appendChild(titleBar);

  const output = document.createElement("pre");
  output.style.whiteSpace = "pre-wrap";
  output.style.margin = "10px";
  output.style.height = "140px";
  output.style.overflowY = "auto";
  output.textContent = initialMessage;
  win.appendChild(output);

  document.body.appendChild(win);
  makeDraggable(win, titleBar);
}
