/**
 * Operation types for the history system
 * Each operation represents a single edit action that can be undone/redone
 */

import type { TextOverlay, AudioClip } from './project.js';

export type Operation =
  | TrimOperation
  | AddTextOperation
  | UpdateTextOperation
  | RemoveTextOperation
  | AddAudioOperation
  | UpdateAudioOperation
  | RemoveAudioOperation
  | AddVideoOperation
  | RemoveVideoOperation;

export interface TrimOperation {
  type: 'trim';
  clipId: string;
  previousStart: number;
  previousEnd: number;
  newStart: number;
  newEnd: number;
}

export interface AddTextOperation {
  type: 'addText';
  overlay: TextOverlay;
}

export interface UpdateTextOperation {
  type: 'updateText';
  overlayId: string;
  previousState: TextOverlay;
  newState: TextOverlay;
}

export interface RemoveTextOperation {
  type: 'removeText';
  overlay: TextOverlay;
}

export interface AddAudioOperation {
  type: 'addAudio';
  trackId: string;
  clip: AudioClip;
}

export interface UpdateAudioOperation {
  type: 'updateAudio';
  trackId: string;
  clipId: string;
  previousState: AudioClip;
  newState: AudioClip;
}

export interface RemoveAudioOperation {
  type: 'removeAudio';
  trackId: string;
  clip: AudioClip;
}

export interface AddVideoOperation {
  type: 'addVideo';
  clipId: string;
  sourceFile: string;
}

export interface RemoveVideoOperation {
  type: 'removeVideo';
  clipId: string;
  sourceFile: string;
}
