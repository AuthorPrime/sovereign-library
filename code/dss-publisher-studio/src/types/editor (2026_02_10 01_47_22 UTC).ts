export interface TabData {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  savedContent: string;
  isDirty: boolean;
  cursorLine: number;
  cursorColumn: number;
}

export type SidebarView = 'explorer' | 'templates' | 'search' | 'chat';
export type PanelView = 'terminal' | 'output';
