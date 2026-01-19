import React, { useRef, useCallback, useEffect } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import {
  setTimelineZoom,
  setTimelineScrollPosition,
} from '../stores/projectSlice';
import { setCurrentTime } from '../stores/videoSlice';
import { useTrimming } from '../hooks/useTrimming';
import { TimeRuler } from './TimeRuler';
import { VideoClipComponent } from './VideoClipComponent';
import './Timeline.css';

export function Timeline() {
  const dispatch = useAppDispatch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const project = useAppSelector((state) => state.project.project);
  const zoom = useAppSelector((state) => state.project.timelineZoom);
  const scrollPosition = useAppSelector(
    (state) => state.project.timelineScrollPosition
  );
  const currentTime = useAppSelector((state) => state.video.currentTime);
  const duration = useAppSelector((state) => state.video.duration);

  const {
    selectedClipId,
    startTrim,
    updateTrim,
    endTrim,
    selectVideoClip,
    getClipMetadata,
  } = useTrimming();

  const videoClips = project?.timeline.videoTrack || [];
  const timelineDuration = Math.max(
    project?.timeline.duration || 0,
    duration,
    60
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      dispatch(setTimelineScrollPosition(e.currentTarget.scrollLeft));
    },
    [dispatch]
  );

  const handleSeek = useCallback(
    (time: number) => {
      dispatch(setCurrentTime(time));
    },
    [dispatch]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        dispatch(setTimelineZoom(zoom + delta));
      }
    },
    [dispatch, zoom]
  );

  const handleZoomIn = useCallback(() => {
    dispatch(setTimelineZoom(zoom + 10));
  }, [dispatch, zoom]);

  const handleZoomOut = useCallback(() => {
    dispatch(setTimelineZoom(zoom - 10));
  }, [dispatch, zoom]);

  const handleTrackClick = useCallback(() => {
    selectVideoClip(null);
  }, [selectVideoClip]);

  // Calculate playhead position
  const playheadPosition = currentTime * zoom;

  // Sync scroll position when component mounts or scrollPosition changes externally
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollPosition;
    }
  }, [scrollPosition]);

  return (
    <div className="timeline" onWheel={handleWheel}>
      <div className="timeline-header">
        <span className="timeline-title">Timeline</span>
        <div className="timeline-controls">
          <button
            className="zoom-button"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            -
          </button>
          <span className="zoom-level">{zoom}px/s</span>
          <button
            className="zoom-button"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div
        className="timeline-scroll-container"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <div
          className="timeline-content"
          style={{ width: timelineDuration * zoom }}
        >
          <TimeRuler
            duration={timelineDuration}
            zoom={zoom}
            scrollPosition={scrollPosition}
            onSeek={handleSeek}
          />

          <div className="timeline-tracks">
            <div className="track video-track" onClick={handleTrackClick}>
              <div className="track-label">Video</div>
              <div className="track-content">
                {videoClips.length === 0 ? (
                  <div className="track-placeholder">No video clips</div>
                ) : (
                  videoClips.map((clip) => (
                    <VideoClipComponent
                      key={clip.id}
                      clip={clip}
                      metadata={getClipMetadata(clip.sourceFile)}
                      zoom={zoom}
                      isSelected={clip.id === selectedClipId}
                      onSelect={() => selectVideoClip(clip.id)}
                      onTrimStart={(side) => startTrim(clip.id, side)}
                      onTrimMove={updateTrim}
                      onTrimEnd={endTrim}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="track audio-track">
              <div className="track-label">Audio</div>
              <div className="track-content">
                <div className="track-placeholder">No audio clips</div>
              </div>
            </div>

            <div className="track text-track">
              <div className="track-label">Text</div>
              <div className="track-content">
                <div className="track-placeholder">No text overlays</div>
              </div>
            </div>
          </div>

          {/* Playhead */}
          <div
            className="timeline-playhead"
            style={{ left: playheadPosition + 80 }} // 80px offset for track labels
          >
            <div className="playhead-head" />
            <div className="playhead-line" />
          </div>
        </div>
      </div>
    </div>
  );
}
