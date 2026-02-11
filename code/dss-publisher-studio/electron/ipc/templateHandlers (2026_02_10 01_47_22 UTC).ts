import { ipcMain } from 'electron';
import * as templateService from '../services/templateService';

export function registerTemplateHandlers() {
  ipcMain.handle('templates:list', async () => {
    return templateService.listTemplates();
  });

  ipcMain.handle('templates:read', async (_event, name: string) => {
    return templateService.readTemplate(name);
  });

  ipcMain.handle('templates:createFrom', async (_event, templateName: string, projectPath: string) => {
    return templateService.createFromTemplate(templateName, projectPath);
  });
}
