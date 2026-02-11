import { ipcMain } from 'electron';
import * as fileService from '../services/fileService';

export function registerFileHandlers() {
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    return fileService.readFile(filePath);
  });

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    return fileService.writeFile(filePath, content);
  });

  ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
    return fileService.readDir(dirPath);
  });

  ipcMain.handle('fs:stat', async (_event, filePath: string) => {
    return fileService.statFile(filePath);
  });

  ipcMain.handle('fs:mkdir', async (_event, dirPath: string) => {
    return fileService.mkdirRecursive(dirPath);
  });

  ipcMain.handle('fs:rename', async (_event, oldPath: string, newPath: string) => {
    return fileService.renameFile(oldPath, newPath);
  });

  ipcMain.handle('fs:delete', async (_event, filePath: string) => {
    return fileService.deleteFile(filePath);
  });
}
