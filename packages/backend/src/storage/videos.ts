import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import ffmpeg, { type FfprobeData } from 'fluent-ffmpeg';
import type { VideoMetadata } from '@agent-vid/shared';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
}

export class VideoStorage {
  private videos: Map<string, VideoMetadata> = new Map();

  constructor() {
    ensureDirectories();
  }

  async storeFile(
    file: Express.Multer.File
  ): Promise<VideoMetadata> {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${id}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Move file from temp location to uploads directory
    await fs.rename(file.path, filePath);

    // Extract metadata
    const metadata = await this.extractMetadata(filePath);
    const videoMetadata: VideoMetadata = {
      id,
      filename: file.originalname,
      url: `/api/videos/${id}`,
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
      fps: metadata.fps,
      codec: metadata.codec,
      fileSize: metadata.fileSize,
      thumbnailUrl: `/api/videos/${id}/thumbnail`,
      createdAt: new Date().toISOString(),
    };

    // Generate thumbnail
    await this.generateThumbnail(id, filePath);

    this.videos.set(id, videoMetadata);
    return videoMetadata;
  }

  async fetchFromUrl(url: string): Promise<VideoMetadata> {
    // For now, just validate the URL is accessible
    // In production, you'd want to download and process the video
    const id = uuidv4();

    // Try to get metadata from URL directly (works for some URLs)
    const metadata = await this.extractMetadataFromUrl(url);

    const videoMetadata: VideoMetadata = {
      id,
      filename: url.split('/').pop() || 'video',
      url, // Direct URL for now
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
      fps: metadata.fps,
      codec: metadata.codec,
      fileSize: metadata.fileSize,
      createdAt: new Date().toISOString(),
    };

    this.videos.set(id, videoMetadata);
    return videoMetadata;
  }

  private async extractMetadata(
    filePath: string
  ): Promise<{
    width: number;
    height: number;
    duration: number;
    fps: number;
    codec: string;
    fileSize: number;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data: FfprobeData) => {
        if (err) {
          // Return defaults if ffprobe fails
          resolve({
            width: 0,
            height: 0,
            duration: 0,
            fps: 0,
            codec: 'unknown',
            fileSize: 0,
          });
          return;
        }

        const videoStream = data.streams.find((s) => s.codec_type === 'video');
        let fps = 0;
        if (videoStream?.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
          fps = den ? Math.round(num / den) : num;
        }

        const duration = data.format.duration;
        const size = data.format.size;

        resolve({
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          duration: typeof duration === 'number' ? duration : parseFloat(String(duration)) || 0,
          fps,
          codec: videoStream?.codec_name || 'unknown',
          fileSize: typeof size === 'number' ? size : parseInt(String(size)) || 0,
        });
      });
    });
  }

  private async extractMetadataFromUrl(url: string): Promise<{
    width: number;
    height: number;
    duration: number;
    fps: number;
    codec: string;
    fileSize: number;
  }> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(url, (err, data: FfprobeData) => {
        if (err) {
          // Return defaults if ffprobe fails
          resolve({
            width: 0,
            height: 0,
            duration: 0,
            fps: 0,
            codec: 'unknown',
            fileSize: 0,
          });
          return;
        }

        const videoStream = data.streams.find((s) => s.codec_type === 'video');
        let fps = 0;
        if (videoStream?.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
          fps = den ? Math.round(num / den) : num;
        }

        const duration = data.format.duration;
        const size = data.format.size;

        resolve({
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          duration: typeof duration === 'number' ? duration : parseFloat(String(duration)) || 0,
          fps,
          codec: videoStream?.codec_name || 'unknown',
          fileSize: typeof size === 'number' ? size : parseInt(String(size)) || 0,
        });
      });
    });
  }

  private async generateThumbnail(id: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .screenshots({
          count: 1,
          folder: THUMBNAILS_DIR,
          filename: `${id}.jpg`,
          size: '320x180',
        })
        .on('end', () => resolve())
        .on('error', (err) => {
          console.error('Thumbnail generation failed:', err);
          resolve(); // Don't fail if thumbnail fails
        });
    });
  }

  async getFilePath(id: string): Promise<string | null> {
    const video = this.videos.get(id);
    if (!video) return null;

    // Find file in uploads directory
    const files = await fs.readdir(UPLOADS_DIR);
    const file = files.find((f) => f.startsWith(id));
    return file ? path.join(UPLOADS_DIR, file) : null;
  }

  async getThumbnailPath(id: string): Promise<string | null> {
    const thumbnailPath = path.join(THUMBNAILS_DIR, `${id}.jpg`);
    try {
      await fs.access(thumbnailPath);
      return thumbnailPath;
    } catch {
      return null;
    }
  }

  get(id: string): VideoMetadata | undefined {
    return this.videos.get(id);
  }

  async delete(id: string): Promise<boolean> {
    const video = this.videos.get(id);
    if (!video) return false;

    // Delete video file
    const filePath = await this.getFilePath(id);
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Delete thumbnail
    const thumbnailPath = await this.getThumbnailPath(id);
    if (thumbnailPath) {
      try {
        await fs.unlink(thumbnailPath);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    this.videos.delete(id);
    return true;
  }
}
