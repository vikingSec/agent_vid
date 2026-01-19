import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { VideoStorage } from '../storage/videos.js';

export const videosRouter = Router();
const storage = new VideoStorage();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, MOV, and AVI are allowed.'));
    }
  },
});

// Upload video file
videosRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const video = await storage.storeFile(req.file);
    res.status(201).json({ success: true, video });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to process video' });
  }
});

// Load video from URL
videosRouter.post('/from-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'URL is required' });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      res.status(400).json({ success: false, error: 'Invalid URL' });
      return;
    }

    const video = await storage.fetchFromUrl(url);
    res.status(201).json({ success: true, video });
  } catch (error) {
    console.error('URL load error:', error);
    res.status(500).json({ success: false, error: 'Failed to load video from URL' });
  }
});

// Stream video file
videosRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const video = storage.get(req.params.id);
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const filePath = await storage.getFilePath(req.params.id);
    if (!filePath) {
      // If it's a URL-based video, redirect to the original URL
      if (video.url.startsWith('http')) {
        res.redirect(video.url);
        return;
      }
      res.status(404).json({ error: 'Video file not found' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests for video seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Get video metadata
videosRouter.get('/:id/metadata', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const video = storage.get(req.params.id);
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metadata' });
  }
});

// Get video thumbnail
videosRouter.get('/:id/thumbnail', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const thumbnailPath = await storage.getThumbnailPath(req.params.id);
    if (!thumbnailPath) {
      res.status(404).json({ error: 'Thumbnail not found' });
      return;
    }
    res.sendFile(thumbnailPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get thumbnail' });
  }
});

// Delete video
videosRouter.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const deleted = await storage.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});
