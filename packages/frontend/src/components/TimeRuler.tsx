import React, { useMemo } from 'react';
import './TimeRuler.css';

interface TimeRulerProps {
  duration: number;
  zoom: number; // pixels per second
  scrollPosition: number;
  onSeek: (time: number) => void;
}

export function TimeRuler({ duration, zoom, scrollPosition, onSeek }: TimeRulerProps) {
  // Calculate tick marks based on zoom level
  const ticks = useMemo(() => {
    const result: { time: number; type: 'major' | 'minor' }[] = [];

    // Adjust tick interval based on zoom
    let majorInterval: number;
    let minorCount: number;

    if (zoom >= 100) {
      majorInterval = 1; // 1 second
      minorCount = 4;
    } else if (zoom >= 50) {
      majorInterval = 5; // 5 seconds
      minorCount = 5;
    } else if (zoom >= 25) {
      majorInterval = 10; // 10 seconds
      minorCount = 5;
    } else {
      majorInterval = 30; // 30 seconds
      minorCount = 6;
    }

    const minorInterval = majorInterval / minorCount;
    const totalDuration = Math.max(duration, 60); // At least 1 minute

    for (let time = 0; time <= totalDuration; time += minorInterval) {
      const isMajor = Math.abs(time % majorInterval) < 0.001;
      result.push({ time, type: isMajor ? 'major' : 'minor' });
    }

    return result;
  }, [duration, zoom]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollPosition;
    const time = x / zoom;
    onSeek(Math.max(0, Math.min(time, duration)));
  };

  const totalWidth = Math.max(duration, 60) * zoom;

  return (
    <div
      className="time-ruler"
      onClick={handleClick}
      style={{ width: totalWidth }}
    >
      {ticks.map(({ time, type }) => (
        <div
          key={time}
          className={`time-tick time-tick-${type}`}
          style={{ left: time * zoom }}
        >
          {type === 'major' && (
            <span className="time-label">{formatTime(time)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
