import React, { useCallback } from 'react';
import type { VideoClip } from '@agent-vid/shared';
import type { VideoMetadata } from '@agent-vid/shared';
import { TrimHandle } from './TrimHandle';
import './VideoClipComponent.css';

interface VideoClipComponentProps {
  clip: VideoClip;
  metadata: VideoMetadata | undefined;
  zoom: number; // pixels per second
  isSelected: boolean;
  onSelect: () => void;
  onTrimStart: (side: 'left' | 'right') => void;
  onTrimMove: (side: 'left' | 'right', deltaTime: number) => void;
  onTrimEnd: () => void;
}

export function VideoClipComponent({
  clip,
  metadata,
  zoom,
  isSelected,
  onSelect,
  onTrimStart,
  onTrimMove,
  onTrimEnd,
}: VideoClipComponentProps) {
  const clipDuration = clip.endTime - clip.startTime;
  const width = clipDuration * zoom;
  const left = clip.startTime * zoom;

  const handleLeftDrag = useCallback(
    (deltaPixels: number) => {
      const deltaTime = deltaPixels / zoom;
      onTrimMove('left', deltaTime);
    },
    [zoom, onTrimMove]
  );

  const handleRightDrag = useCallback(
    (deltaPixels: number) => {
      const deltaTime = deltaPixels / zoom;
      onTrimMove('right', deltaTime);
    },
    [zoom, onTrimMove]
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <div
      className={`video-clip ${isSelected ? 'video-clip-selected' : ''}`}
      style={{ width, left }}
      onClick={handleClick}
    >
      <div className="video-clip-content">
        {metadata?.thumbnailUrl && (
          <div
            className="video-clip-thumbnail"
            style={{ backgroundImage: `url(${metadata.thumbnailUrl})` }}
          />
        )}
        <span className="video-clip-name">
          {metadata?.filename || 'Video'}
        </span>
        <span className="video-clip-duration">
          {formatDuration(clipDuration)}
        </span>
      </div>

      {isSelected && (
        <>
          <TrimHandle
            side="left"
            position={0}
            onDrag={handleLeftDrag}
            onDragStart={() => onTrimStart('left')}
            onDragEnd={onTrimEnd}
          />
          <TrimHandle
            side="right"
            position={0}
            onDrag={handleRightDrag}
            onDragStart={() => onTrimStart('right')}
            onDragEnd={onTrimEnd}
          />
        </>
      )}

      <div className="video-clip-trim-region">
        <span className="trim-time trim-start">
          {formatDuration(clip.trimStart)}
        </span>
        <span className="trim-time trim-end">
          {formatDuration(clip.trimEnd)}
        </span>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
  return `${secs}.${ms.toString().padStart(2, '0')}s`;
}
