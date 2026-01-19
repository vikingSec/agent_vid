import { Router, type Request, type Response } from 'express';
import { ProjectStorage } from '../storage/projects.js';

export const projectsRouter = Router();
const storage = new ProjectStorage();

interface IdParams {
  id: string;
}

// List all projects
projectsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const projects = await storage.list();
    res.json(projects);
  } catch {
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// Get a single project
projectsRouter.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const project = await storage.get(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch {
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Create a new project
projectsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body as { name?: unknown };
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }
    const project = await storage.create(name);
    res.status(201).json(project);
  } catch {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project
projectsRouter.put('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const project = await storage.update(req.params.id, req.body);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
projectsRouter.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const deleted = await storage.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});
