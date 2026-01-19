/**
 * Core project types for the video editor
 */

import type { HistoryBranch } from './history.js';

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  timeline: Timeline;
  history: HistoryBranch[];
  currentBranch: string;
}

export interface Timeline {
  duration: number;
  videoTrack: VideoClip[];
  audioTracks: AudioTrack[];
  textOverlays: TextOverlay[];
}

export interface VideoClip {
  id: string;
  sourceFile: string;
  startTime: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
}

export interface AudioTrack {
  id: string;
  clips: AudioClip[];
  volume: number;
  muted: boolean;
}

export interface AudioClip {
  id: string;
  sourceFile: string;
  startTime: number;
  duration: number;
  volume: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: Position;
  style: TextStyle;
}

export interface Position {
  x: number;
  y: number;
  anchor: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowOffset?: { x: number; y: number };
}
