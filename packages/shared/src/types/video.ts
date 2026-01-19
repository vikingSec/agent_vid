/**
 * Video metadata extracted from uploaded/loaded videos
 */
export interface VideoMetadata {
  id: string;
  filename: string;
  url: string; // URL for playback (server URL or blob URL)
  width: number;
  height: number;
  duration: number; // in seconds
  fps: number;
  codec: string;
  fileSize: number; // in bytes
  thumbnailUrl?: string;
  createdAt: string;
}

export interface VideoUploadResponse {
  success: boolean;
  video?: VideoMetadata;
  error?: string;
}

export interface VideoLoadRequest {
  type: 'file' | 'url';
  url?: string;
}
