import { BrowserWindow, dialog } from 'electron';
import * as path from 'path';

export function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.loadFile('public/index.html');
}

// 在主进程中定义一个方法来显示保存对话框
export async function showSaveViewDialog(option: Electron.SaveDialogOptions): Promise<string | undefined> {
    const result = await dialog.showSaveDialog(option);
    if (!result.canceled && result.filePath) {
        return result.filePath;
    } else {
        return undefined;
    }
}

export async function showOpenViewDialog(option: Electron.OpenDialogOptions): Promise<string | undefined> {
    const result = await dialog.showOpenDialog(option);
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    } else {
        return undefined;
    }
}