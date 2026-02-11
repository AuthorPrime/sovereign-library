import { ipcMain } from 'electron';
import * as recentService from '../services/recentProjectsService';

export function registerProjectHandlers() {
  ipcMain.handle('project:recent', async () => {
    return recentService.getRecentProjects();
  });

  ipcMain.handle('project:addRecent', async (_event, projectPath: string) => {
    return recentService.addRecentProject(projectPath);
  });
}
