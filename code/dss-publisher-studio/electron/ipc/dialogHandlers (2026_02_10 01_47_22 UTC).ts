import { ipcMain, dialog, BrowserWindow } from 'electron';

export function registerDialogHandlers(window: BrowserWindow) {
  ipcMain.handle('dialog:open', async (_event, options: any) => {
    const result = await dialog.showOpenDialog(window, {
      title: options?.title || 'Open',
      defaultPath: options?.defaultPath,
      properties: options?.properties || ['openFile'],
      filters: options?.filters,
    });
    if (result.canceled) return null;
    return result.filePaths;
  });

  ipcMain.handle('dialog:save', async (_event, options: any) => {
    const result = await dialog.showSaveDialog(window, {
      title: options?.title || 'Save',
      defaultPath: options?.defaultPath,
      filters: options?.filters,
    });
    if (result.canceled) return null;
    return result.filePath;
  });
}
