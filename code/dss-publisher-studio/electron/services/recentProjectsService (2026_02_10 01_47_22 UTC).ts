import fs from 'fs/promises';
import path from 'path';
import { DSS_STUDIO_CONFIG } from '../util/paths';

interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
}

interface StudioConfig {
  recentProjects: RecentProject[];
}

const MAX_RECENT = 10;

async function readConfig(): Promise<StudioConfig> {
  try {
    const raw = await fs.readFile(DSS_STUDIO_CONFIG, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { recentProjects: [] };
  }
}

async function writeConfig(config: StudioConfig): Promise<void> {
  const dir = path.dirname(DSS_STUDIO_CONFIG);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DSS_STUDIO_CONFIG, JSON.stringify(config, null, 2), 'utf-8');
}

export async function getRecentProjects(): Promise<RecentProject[]> {
  const config = await readConfig();
  return config.recentProjects;
}

export async function addRecentProject(projectPath: string): Promise<void> {
  const config = await readConfig();
  const name = path.basename(projectPath);

  // Remove existing entry if present
  config.recentProjects = config.recentProjects.filter((p) => p.path !== projectPath);

  // Add to front
  config.recentProjects.unshift({
    path: projectPath,
    name,
    lastOpened: Date.now(),
  });

  // Trim to max
  config.recentProjects = config.recentProjects.slice(0, MAX_RECENT);

  await writeConfig(config);
}
