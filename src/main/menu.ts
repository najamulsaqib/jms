import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
  dialog,
  ipcMain,
} from 'electron';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'JMS Tax',
      submenu: [
        {
          label: 'About JMS Tax',
          click: () => {
            dialog
              .showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'About JMS Tax',
                message: 'JMS Tax Consultancy',
                detail: `Version: ${app.getVersion()}
Platform: ${process.platform}-${process.arch}
Electron: ${process.versions.electron}
Chrome: ${process.versions.chrome}
Node.js: ${process.versions.node}
V8: ${process.versions.v8}

A desktop application built with Electron and React, designed to help tax consultants manage their clients and tax-related tasks efficiently.

📧 Support: 1najamulsaqib@gmail.com
🌐 Website: https://najamulsaqib.me
📖 GitHub: https://github.com/najamulsaqib/jms
🐛 Report Issues: https://github.com/najamulsaqib/jms/issues

© ${new Date().getFullYear()} Najam UL Saqib
Licensed under MIT License

Made with ❤️ using Electron + React + TypeScript`,
                buttons: ['OK', 'Visit Website'],
              })
              .then((result) => {
                if (result.response === 1) {
                  shell.openExternal('https://najamulsaqib.me');
                }
                return result;
              })
              .catch((err) => {
                // eslint-disable-next-line no-console
                console.error('Error showing about dialog:', err);
              });
          },
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => {
            ipcMain.emit('check-for-updates');
          },
        },
        // { type: 'separator' },
        // { label: 'Services', submenu: [] },
        // { type: 'separator' },
        {
          label: 'Hide JMS Tax',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Support Contact',
          click: () => {
            dialog.showMessageBox(this.mainWindow, {
              type: 'info',
              title: 'Contact Support',
              message: 'Contact developer for support',
              detail: `For support, please contact us at:

📧 Email: 1najamulsaqib@gmail.com
🌐 Website: https://najamulsaqib.me
📖 GitHub: https://github.com/najamulsaqib`,
            });
          },
        },
      ],
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
        ? subMenuViewDev
        : subMenuViewProd;

    return [subMenuAbout, subMenuView, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: MenuItemConstructorOptions = {
      label: 'JMS Tax',
      submenu: [
        {
          label: 'About JMS Tax',
          click: () => {
            dialog
              .showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'About JMS Tax',
                message: 'JMS Tax App',
                detail: `Version: ${app.getVersion()}
Platform: ${process.platform}-${process.arch}
Electron: ${process.versions.electron}
Chrome: ${process.versions.chrome}
Node.js: ${process.versions.node}
V8: ${process.versions.v8}

A desktop application built with Electron and React, designed to help tax consultants manage their clients and tax-related tasks efficiently.

📧 Support: 1najamulsaqib@gmail.com
🌐 Website: https://najamulsaqib.me
📖 GitHub: https://github.com/najamulsaqib/jms
🐛 Report Issues: https://github.com/najamulsaqib/jms/issues

© ${new Date().getFullYear()} Najam UL Saqib
Licensed under MIT License

Made with ❤️ using Electron + React + TypeScript`,
                buttons: ['OK', 'Visit Website'],
              })
              .then((result) => {
                if (result.response === 1) {
                  shell.openExternal('https://najamulsaqib.me');
                }
                return result;
              })
              .catch((err) => {
                // eslint-disable-next-line no-console
                console.error('Error showing about dialog:', err);
              });
          },
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => {
            ipcMain.emit('check-for-updates');
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Ctrl+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'F11',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Ctrl+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Ctrl+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'F11',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow: MenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Ctrl+M',
          click: () => {
            this.mainWindow.minimize();
          },
        },
        {
          label: 'Close',
          accelerator: 'Ctrl+W',
          click: () => {
            this.mainWindow.close();
          },
        },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Support Contact',
          click: () => {
            dialog.showMessageBox(this.mainWindow, {
              type: 'info',
              title: 'Contact Support',
              message: 'Contact developer for support',
              detail: `For support, please contact us at:

📧 Email: 1najamulsaqib@gmail.com
🌐 Website: https://najamulsaqib.me
📖 GitHub: https://github.com/najamulsaqib`,
            });
          },
        },
      ],
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
        ? subMenuViewDev
        : subMenuViewProd;

    return [subMenuAbout, subMenuView, subMenuWindow, subMenuHelp];
  }
}
