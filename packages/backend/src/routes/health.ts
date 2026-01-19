import { Router, type Request, type Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
export const healthRouter = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    ffmpeg: {
      available: boolean;
      version?: string;
      error?: string;
    };
  };
}

healthRouter.get('/', async (_req: Request, res: Response) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      ffmpeg: {
        available: false,
      },
    },
  };

  // Check FFmpeg availability
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    const versionMatch = stdout.match(/ffmpeg version (\S+)/);
    health.services.ffmpeg = {
      available: true,
      version: versionMatch ? versionMatch[1] : 'unknown',
    };
  } catch (error) {
    health.status = 'degraded';
    health.services.ffmpeg = {
      available: false,
      error: 'FFmpeg not found. Video processing will not work.',
    };
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

