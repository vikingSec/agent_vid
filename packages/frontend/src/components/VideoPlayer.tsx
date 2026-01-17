import { useRef, useEffect, useCallback } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import {
  setPlaying,
  setCurrentTime,
  setDuration,
  setVolume,
  setMuted,
} from '../stores/videoSlice';
import { useTrimming } from '../hooks/useTrimming';
import './VideoPlayer.css';

export function VideoPlayer() {
  const dispatch = useAppDispatch();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    loadedVideos,
    currentVideoId,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
  } = useAppSelector((state) => state.video);

  const { selectedClip, setTrimIn, setTrimOut } = useTrimming();

  const currentVideo = currentVideoId ? loadedVideos[currentVideoId] : null;

  // Check if current video has an active trim region
  const hasTrimRegion = selectedClip && duration > 0;
  const trimStartPercent = hasTrimRegion
    ? (selectedClip.trimStart / duration) * 100
    : 0;
  const trimEndPercent = hasTrimRegion
    ? (selectedClip.trimEnd / duration) * 100
    : 100;

  // Sync video element with Redux state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => dispatch(setPlaying(false)));
    } else {
      video.pause();
    }
  }, [isPlaying, dispatch]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  // Loop within trim region if clip is selected
  useEffect(() => {
    if (!selectedClip || !videoRef.current) return;

    const video = videoRef.current;
    if (currentTime >= selectedClip.trimEnd && isPlaying) {
      video.currentTime = selectedClip.trimStart;
      dispatch(setCurrentTime(selectedClip.trimStart));
    }
  }, [currentTime, selectedClip, isPlaying, dispatch]);

  // Keyboard shortcuts for I/O (set in/out points)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'i') {
        // Set in point
        setTrimIn(currentTime);
      } else if (e.key.toLowerCase() === 'o') {
        // Set out point
        setTrimOut(currentTime);
      } else if (e.key === ' ') {
        // Space to play/pause
        e.preventDefault();
        dispatch(setPlaying(!isPlaying));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, setTrimIn, setTrimOut, dispatch, isPlaying]);

  const togglePlay = useCallback(() => {
    dispatch(setPlaying(!isPlaying));
  }, [dispatch, isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      dispatch(setCurrentTime(videoRef.current.currentTime));
    }
  }, [dispatch]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      dispatch(setDuration(videoRef.current.duration));
    }
  }, [dispatch]);

  const handleEnded = useCallback(() => {
    dispatch(setPlaying(false));
  }, [dispatch]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !videoRef.current || !duration) return;

      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;

      videoRef.current.currentTime = newTime;
      dispatch(setCurrentTime(newTime));
    },
    [dispatch, duration]
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setVolume(parseFloat(e.target.value)));
    },
    [dispatch]
  );

  const toggleMute = useCallback(() => {
    dispatch(setMuted(!muted));
  }, [dispatch, muted]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="video-player">
      <div className="video-container">
        {currentVideo ? (
          <video
            ref={videoRef}
            src={currentVideo.url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          >
            <track kind="captions" />
          </video>
        ) : (
          <div className="video-placeholder">
            <p>No video loaded</p>
            <p className="video-placeholder-hint">
              Upload a video to start editing
            </p>
          </div>
        )}
      </div>

      <div className="video-controls">
        <button
          onClick={togglePlay}
          className="play-button"
          disabled={!currentVideo}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div
          ref={progressRef}
          className="progress-bar-container"
          onClick={handleSeek}
        >
          <div className="progress-bar-bg">
            {/* Trim region overlay */}
            {hasTrimRegion && (
              <>
                <div
                  className="progress-trim-inactive"
                  style={{ left: 0, width: `${trimStartPercent}%` }}
                />
                <div
                  className="progress-trim-active"
                  style={{
                    left: `${trimStartPercent}%`,
                    width: `${trimEndPercent - trimStartPercent}%`,
                  }}
                />
                <div
                  className="progress-trim-inactive"
                  style={{
                    left: `${trimEndPercent}%`,
                    width: `${100 - trimEndPercent}%`,
                  }}
                />
              </>
            )}
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <span className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="volume-controls">
          <button onClick={toggleMute} className="mute-button">
            {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>

      {currentVideo && (
        <div className="video-info">
          <span>{currentVideo.filename}</span>
          <span>
            {currentVideo.width}×{currentVideo.height} • {currentVideo.fps}fps
          </span>
        </div>
      )}

      {selectedClip && (
        <div className="trim-info">
          <span>
            Trim: {formatTime(selectedClip.trimStart)} -{' '}
            {formatTime(selectedClip.trimEnd)}
          </span>
          <span className="trim-hint">Press I/O to set in/out points</span>
        </div>
      )}
    </div>
  );
}
