# Beta Channel System - Setup Complete! 🎉

The beta channel system has been successfully implemented in JMS Tax. Users can now opt-in to receive beta updates or stay on the stable channel.

## 📁 Files Created/Modified

### Main Process (Electron)

- ✅ `src/main/updater.ts` - Beta channel updater logic
- ✅ `src/main/ipc/updater.handlers.ts` - IPC handlers for channel switching
- ✅ `src/main/preload.ts` - Updated with updater API
- ✅ `src/main/main.ts` - Updated to use new updater system

### Renderer Process (React)

- ✅ `src/renderer/hooks/useUpdater.ts` - React hook for channel management
- ✅ `src/renderer/pages/settings/index.tsx` - Settings UI with channel switcher

### Dependencies

- ✅ `electron-store` - Installed for storing user preferences

## 🚀 How It Works

### For Users

1. **Open Settings Page**
   - Navigate to Settings in the app
   - See current version and update channel

2. **Switch Channels**
   - Choose between **Stable** (production) or **Beta** (early access)
   - Click the desired channel card
   - App automatically checks for updates on the new channel

3. **Check for Updates**
   - Click "Check for Updates" button
   - App will notify if update is available

### Channel Behavior

| Channel    | Updates                          | Prerelease | Use Case                |
| ---------- | -------------------------------- | ---------- | ----------------------- |
| **Stable** | `v1.0.0`, `v1.1.0`               | ❌ No      | Production users        |
| **Beta**   | `v1.0.0-beta.0`, `v1.0.0-beta.1` | ✅ Yes     | Testers, early adopters |

## 🔧 Technical Details

### How Channel Switching Works

1. User selects channel in UI
2. `useUpdater` hook calls IPC → `updater:setChannel`
3. Main process:
   - Stores preference in `electron-store`
   - Sets `autoUpdater.allowPrerelease = true/false`
   - Checks for updates on new channel
4. Auto-updater fetches appropriate releases from GitHub

### Release Detection

```javascript
// Stable Channel (allowPrerelease: false)
autoUpdater.allowPrerelease = false;
// → Fetches: v1.0.0, v1.1.0, v2.0.0
// → Ignores: v1.0.0-beta.0, v1.0.0-beta.1

// Beta Channel (allowPrerelease: true)
autoUpdater.allowPrerelease = true;
// → Fetches: v1.0.0-beta.0, v1.0.0-beta.1, v1.0.0-beta.2
// → Also shows: v1.0.0, v1.1.0 (stable releases)
```

## 📦 Creating Releases

### Beta Release Workflow

1. **Create Beta Release:**

   ```
   GitHub Actions → Build and Release
   - Bump: patch/minor/major
   - Channel: beta
   ```

2. **Result:**
   - Tag: `v1.0.0-beta.0`
   - GitHub Release: Marked as "Pre-release"
   - Beta users get notified

3. **Create More Betas:**
   - Run again → `v1.0.0-beta.1`, etc.

### Stable Release Workflow

1. **Promote to Stable:**

   ```
   GitHub Actions → Build and Release
   - Bump: patch/minor/major
   - Channel: latest
   ```

2. **Result:**
   - Tag: `v1.0.0`
   - GitHub Release: Normal release
   - Stable users get notified

## 🎨 UI Components

### Settings Page Preview

The settings page includes:

- **Current Version Display** - Shows installed version
- **Channel Selector** - Two cards (Stable vs Beta)
- **Check for Updates Button** - Manual update check
- **Beta Warning** - Appears when on beta channel

## 🔐 Security & Best Practices

### Auto-Update Security

- ✅ Uses GitHub releases (signed)
- ✅ HTTPS only
- ✅ User confirmation before download
- ✅ User confirmation before install

### User Experience

- ✅ Non-intrusive notifications
- ✅ Background downloads
- ✅ Install on quit (no force restart)
- ✅ Clear channel indicators

## 🛠️ Configuration

### Update Check Frequency

Currently checks on startup. To add periodic checks:

```typescript
// src/main/updater.ts - add to constructor
setInterval(
  () => {
    if (app.isPackaged) {
      this.checkForUpdates();
    }
  },
  60 * 60 * 1000,
); // Every hour
```

### Custom Update Server

If not using GitHub:

```json
// package.json
"build": {
  "publish": {
    "provider": "generic",
    "url": "https://your-server.com/updates"
  }
}
```

## 📊 User Preferences Storage

Preferences are stored in:

- **Windows:** `%APPDATA%/jms-tax/config.json`
- **macOS:** `~/Library/Application Support/jms-tax/config.json`
- **Linux:** `~/.config/jms-tax/config.json`

```json
{
  "updateChannel": "beta"
}
```

## 🐛 Troubleshooting

### Users Not Getting Beta Updates

**Check:**

1. Is `allowPrerelease` set correctly?
2. Is GitHub release marked as "Pre-release"?
3. Check logs: `autoUpdater.logger`

### Channel Stuck on Beta/Stable

**Solution:**
Delete config and restart:

```bash
# macOS/Linux
rm ~/Library/Application\ Support/jms-tax/config.json

# Windows
del %APPDATA%\jms-tax\config.json
```

## 🎯 Next Steps

### Optional Enhancements

1. **Add Progress Bar**

   ```typescript
   autoUpdater.on('download-progress', (progress) => {
     mainWindow.webContents.send('download-progress', progress.percent);
   });
   ```

2. **Add Changelog Display**
   - Fetch release notes from GitHub
   - Show in update dialog

3. **Add Rollback Feature**
   - Allow reverting to previous version
   - Useful for problematic updates

4. **Add Release Notes in App**
   - Show what's new after update
   - Link to GitHub releases

## ✅ Testing Checklist

Before releasing:

- [ ] Stable channel receives stable releases only
- [ ] Beta channel receives beta releases
- [ ] Channel switching works correctly
- [ ] Update notifications appear
- [ ] Download and install work
- [ ] User preferences persist
- [ ] Settings UI displays correctly
- [ ] Error handling works

## 📝 Usage Examples

### For End Users

**Switch to Beta:**

1. Open JMS Tax
2. Go to Settings
3. Click "Beta Channel" card
4. Click "Check for Updates"

**Switch Back to Stable:**

1. Open Settings
2. Click "Stable Channel" card
3. Wait for next stable release

### For Developers

**Create Beta:**

```bash
# Via GitHub Actions
1. Go to Actions → Build and Release
2. Run workflow:
   - bump: patch
   - channel: beta
```

**Promote to Stable:**

```bash
# Via GitHub Actions
1. Go to Actions → Build and Release
2. Run workflow:
   - bump: patch
   - channel: latest
```

---

**🎉 Beta channel system is fully operational!**

Users can now choose their update preference, and you can safely test features with beta testers before releasing to all users.
