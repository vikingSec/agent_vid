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

  const currentVideo = currentVideoId ? loadedVideos[currentVideoId] : null;

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
            <p className="video-placeholder-hint">Upload a video to start editing</p>
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
    </div>
  );
}
