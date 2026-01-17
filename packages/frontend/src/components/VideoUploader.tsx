import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { uploadVideo, loadVideoFromUrl, clearError } from '../stores/videoSlice';
import './VideoUploader.css';

const ACCEPTED_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

export function VideoUploader() {
  const dispatch = useAppDispatch();
  const { isLoading, uploadProgress, error } = useAppSelector((state) => state.video);

  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && ACCEPTED_FORMATS.includes(file.type)) {
      dispatch(uploadVideo(file));
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      dispatch(uploadVideo(file));
    }
  };

  const handleUrlLoad = () => {
    if (urlInput.trim()) {
      dispatch(loadVideoFromUrl(urlInput.trim()));
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
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
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
