---
description: Expert in Electron-specific features for the JMS Tax application. Handles IPC communication, window management, native features, and main/renderer process coordination.
---

# Electron Skill

You are an Electron expert for the JMS Tax Consultancy desktop application.

## Your Responsibilities

1. **IPC Communication:** Set up secure communication between main and renderer processes
2. **Window Management:** Create and manage application windows
3. **Native Features:** Implement file system access, notifications, and OS integrations
4. **Security:** Follow Electron security best practices
5. **Updates:** Handle auto-updates and application lifecycle

## Project Context

- **Main Process:** `src/main/`
- **Renderer Process:** `src/renderer/`
- **Preload Script:** `src/main/preload.ts` (or similar)
- **Build Config:** `.erb/configs/`

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Main Process (Node.js)          │
│  - Window management                    │
│  - File system access                   │
│  - Native APIs                          │
│  - Database (if local)                  │
└──────────────┬──────────────────────────┘
               │ IPC
               │ (contextBridge)
┌──────────────▼──────────────────────────┐
│      Renderer Process (Browser)         │
│  - React UI                             │
│  - Supabase client                      │
│  - Business logic                       │
└─────────────────────────────────────────┘
```

## IPC Communication Pattern

### 1. Preload Script (Secure Bridge)

**ALWAYS use contextBridge for security:**

```typescript
// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electron', {
  // File operations
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  saveFile: (data: string) => ipcRenderer.invoke('file:save', data),
  readFile: (path: string) => ipcRenderer.invoke('file:read', path),

  // Window operations
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // App operations
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Database (if using local DB)
  db: {
    query: (sql: string, params: any[]) =>
      ipcRenderer.invoke('db:query', sql, params),
  },

  // Listeners
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update:available', callback);
  },
  removeUpdateListener: () => {
    ipcRenderer.removeAllListeners('update:available');
  },
});

// TypeScript types for renderer
export type ElectronAPI = {
  selectFile: () => Promise<string | null>;
  saveFile: (data: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getVersion: () => Promise<string>;
  db: {
    query: (sql: string, params: any[]) => Promise<any>;
  };
  onUpdateAvailable: (callback: () => void) => void;
  removeUpdateListener: () => void;
};

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
```

### 2. Main Process Handlers

```typescript
// src/main/main.ts
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';

// File operations
ipcMain.handle('dialog:selectFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('file:save', async (event, data: string) => {
  const result = await dialog.showSaveDialog({
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  });

  if (!result.canceled && result.filePath) {
    await fs.writeFile(result.filePath, data, 'utf-8');
  }
});

ipcMain.handle('file:read', async (event, filePath: string) => {
  const data = await fs.readFile(filePath, 'utf-8');
  return data;
});

// Window operations
ipcMain.on('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.minimize();
});

ipcMain.on('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.close();
});

// App info
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});
```

### 3. Renderer Usage (React Hooks)

```typescript
// src/renderer/hooks/useElectron.ts
export function useFileSelect() {
  const selectFile = async () => {
    try {
      const filePath = await window.electron.selectFile();
      if (filePath) {
        const content = await window.electron.readFile(filePath);
        return { filePath, content };
      }
      return null;
    } catch (error) {
      console.error('Failed to select file:', error);
      toast.error('Failed to open file');
      return null;
    }
  };

  return { selectFile };
}

export function useWindowControls() {
  return {
    minimize: () => window.electron.minimize(),
    maximize: () => window.electron.maximize(),
    close: () => window.electron.close(),
  };
}

export function useAppVersion() {
  return useQuery({
    queryKey: ['app-version'],
    queryFn: () => window.electron.getVersion(),
    staleTime: Infinity, // Version doesn't change during runtime
  });
}

export function useUpdateNotifications() {
  useEffect(() => {
    const handleUpdate = () => {
      toast.info('Update available! Restart to install.');
    };

    window.electron.onUpdateAvailable(handleUpdate);

    return () => {
      window.electron.removeUpdateListener();
    };
  }, []);
}
```

## Window Management

### Creating Windows

```typescript
// src/main/main.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Use 'ready-to-show' event
    backgroundColor: '#1f2937', // Tailwind gray-800
    titleBarStyle: 'hidden', // For custom title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false, // SECURITY: Always false
      sandbox: true,
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

### Custom Title Bar

```typescript
// src/renderer/components/layout/TitleBar.tsx
import { MinusIcon, Square2StackIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useWindowControls } from '@/hooks/useElectron';

export default function TitleBar() {
  const { minimize, maximize, close } = useWindowControls();

  return (
    <div className="flex items-center justify-between bg-gray-900 px-4 py-2 select-none" style={{ WebkitAppRegion: 'drag' }}>
      <div className="flex items-center gap-2">
        <img src="/icon.png" alt="JMS Tax" className="h-6 w-6" />
        <span className="text-sm font-medium text-white">JMS Tax</span>
      </div>

      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={minimize}
          className="p-1 hover:bg-gray-700 rounded transition"
        >
          <MinusIcon className="h-4 w-4 text-gray-400" />
        </button>
        <button
          onClick={maximize}
          className="p-1 hover:bg-gray-700 rounded transition"
        >
          <Square2StackIcon className="h-4 w-4 text-gray-400" />
        </button>
        <button
          onClick={close}
          className="p-1 hover:bg-red-600 rounded transition"
        >
          <XMarkIcon className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
```

## Native Features

### File System Operations

```typescript
// CSV Export Example
export function useCsvExport() {
  const exportToCsv = async (data: any[], filename: string) => {
    try {
      const csv = convertToCSV(data);
      const result = await dialog.showSaveDialog({
        defaultPath: filename,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      });

      if (!result.canceled && result.filePath) {
        await window.electron.saveFile(result.filePath, csv);
        toast.success('CSV exported successfully');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export CSV');
    }
  };

  return { exportToCsv };
}
```

### PDF Generation

```typescript
// Using jsPDF (already in dependencies)
import jsPDF from 'jspdf';

export function usePdfExport() {
  const exportToPdf = async (data: TaxRecord) => {
    try {
      const doc = new jsPDF();

      // Add content
      doc.text(`Tax Record: ${data.reference_number}`, 10, 10);
      doc.text(`Client: ${data.client_name}`, 10, 20);
      doc.text(`Amount: $${data.amount}`, 10, 30);

      // Save
      const pdfBlob = doc.output('blob');
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await dialog.showSaveDialog({
        defaultPath: `tax-record-${data.reference_number}.pdf`,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      if (!result.canceled && result.filePath) {
        await window.electron.saveFile(
          result.filePath,
          buffer.toString('base64'),
        );
        toast.success('PDF exported successfully');
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    }
  };

  return { exportToPdf };
}
```

### Notifications

```typescript
// Main process
import { Notification } from 'electron';

ipcMain.handle('notification:show', (event, { title, body }) => {
  new Notification({ title, body }).show();
});

// Renderer hook
export function useNativeNotification() {
  const showNotification = (title: string, body: string) => {
    window.electron.showNotification(title, body);
  };

  return { showNotification };
}
```

## Auto-Updates

```typescript
// src/main/main.ts
import { autoUpdater } from 'electron-updater';

function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update:available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update:downloaded');
  });

  // Check for updates every hour
  setInterval(
    () => {
      autoUpdater.checkForUpdatesAndNotify();
    },
    60 * 60 * 1000,
  );
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();
});
```

## Security Best Practices

1. **Context Isolation:** Always `true`
2. **Node Integration:** Always `false`
3. **Sandbox:** Always `true`
4. **Context Bridge:** Use for all IPC
5. **Validate Input:** Always validate IPC messages
6. **CSP:** Implement Content Security Policy
7. **No eval():** Never use eval in renderer
8. **HTTPS Only:** For remote content

## Development vs Production

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // Dev tools
  mainWindow.webContents.openDevTools();

  // React DevTools
  const {
    default: installExtension,
    REACT_DEVELOPER_TOOLS,
  } = require('electron-devtools-installer');
  installExtension(REACT_DEVELOPER_TOOLS);
}
```

## Common Patterns

### Store User Preferences

```typescript
// Use electron-store or save to app.getPath('userData')
import Store from 'electron-store';

const store = new Store();

ipcMain.handle('settings:get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('settings:set', (event, key, value) => {
  store.set(key, value);
});
```

### Prevent Multiple Instances

```typescript
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
```

## Testing Checklist

- [ ] IPC handlers properly registered
- [ ] Context isolation enabled
- [ ] No node integration in renderer
- [ ] Error handling for file operations
- [ ] Window state persisted
- [ ] Auto-updates working
- [ ] Security best practices followed
- [ ] Dev tools disabled in production
