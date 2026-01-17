import { v4 as uuidv4 } from 'uuid';
import type { Project, Timeline } from '@agent-vid/shared';

const createEmptyTimeline = (): Timeline => ({
  duration: 0,
  videoTrack: [],
  audioTracks: [],
  textOverlays: [],
});

const createDefaultBranch = () => ({
  name: 'main',
  operations: [],
  createdAt: new Date().toISOString(),
});

export class ProjectStorage {
  private projects: Map<string, Project> = new Map();

  async list(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async get(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async create(name: string): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      id: uuidv4(),
      name,
      createdAt: now,
      updatedAt: now,
      timeline: createEmptyTimeline(),
      history: [createDefaultBranch()],
      currentBranch: 'main',
    };
    this.projects.set(project.id, project);
    return project;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updated: Project = {
      ...project,
      ...updates,
      id: project.id, // Prevent ID changes
      createdAt: project.createdAt, // Prevent createdAt changes
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }
}
