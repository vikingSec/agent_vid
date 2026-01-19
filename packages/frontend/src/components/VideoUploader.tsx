import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { uploadVideo, loadVideoFromUrl, clearError } from '../stores/videoSlice';
import { addVideoClip, createProject } from '../stores/projectSlice';
import type { VideoClip, VideoMetadata } from '@agent-vid/shared';
import './VideoUploader.css';

const ACCEPTED_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
];

export function VideoUploader() {
  const dispatch = useAppDispatch();
  const { isLoading, uploadProgress, error } = useAppSelector(
    (state) => state.video
  );
  const project = useAppSelector((state) => state.project.project);

  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ensureProject = async () => {
    if (!project) {
      await dispatch(createProject('Untitled Project')).unwrap();
    }
  };

  const addClipToTimeline = (metadata: VideoMetadata) => {
    const clip: VideoClip = {
      id: uuidv4(),
      sourceFile: metadata.id,
      startTime: 0,
      endTime: metadata.duration || 10,
      trimStart: 0,
      trimEnd: metadata.duration || 10,
    };
    dispatch(addVideoClip(clip));
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && ACCEPTED_FORMATS.includes(file.type)) {
      await ensureProject();
      const result = await dispatch(uploadVideo(file)).unwrap();
      addClipToTimeline(result);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await ensureProject();
      const result = await dispatch(uploadVideo(file)).unwrap();
      addClipToTimeline(result);
    }
  };

  const handleUrlLoad = async () => {
    if (urlInput.trim()) {
      await ensureProject();
      const result = await dispatch(loadVideoFromUrl(urlInput.trim())).unwrap();
      addClipToTimeline(result);
      setUrlInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlLoad();
    }
  };

  return (
    <div className="video-uploader">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {isLoading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span>Uploading... {uploadProgress}%</span>
          </div>
        ) : (
          <>
            <div className="drop-icon">📁</div>
            <p>Drag & drop video here</p>
            <p className="drop-hint">or click to browse</p>
          </>
        )}
      </div>

      <div className="url-input-section">
        <input
          type="text"
          placeholder="Or paste video URL..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button onClick={handleUrlLoad} disabled={isLoading || !urlInput.trim()}>
          Load
        </button>
      </div>

      {error && (
        <div className="upload-error">
          <span>{error}</span>
          <button onClick={() => dispatch(clearError())}>×</button>
        </div>
      )}
    </div>
  );
}
