import type { Middleware, UnknownAction } from '@reduxjs/toolkit';
import { recordOperation, undo, redo } from './historySlice';
import { updateVideoClip, addVideoClip, removeVideoClip } from './projectSlice';
import type { Operation, VideoClip } from '@agent-vid/shared';

// Store previous clip state for undo
let previousClipState: Record<string, VideoClip> = {};

// Helper to capture clip state before changes
const captureClipState = (state: {
  project: { project: { timeline: { videoTrack: VideoClip[] } } | null };
}) => {
  const clips = state.project.project?.timeline.videoTrack || [];
  previousClipState = {};
  for (const clip of clips) {
    previousClipState[clip.id] = { ...clip };
  }
};

// Apply an operation (used for redo)
export const applyOperation = (
  operation: Operation,
  dispatch: (action: UnknownAction) => void
) => {
  switch (operation.type) {
    case 'trim': {
      dispatch(
        updateVideoClip({
          clipId: operation.clipId,
          updates: {
            trimStart: operation.newStart,
            trimEnd: operation.newEnd,
          },
        })
      );
      break;
    }
    case 'addVideo': {
      // For addVideo, we need the full clip which isn't stored in the operation
      // This is a simplified implementation
      break;
    }
    case 'removeVideo': {
      dispatch(removeVideoClip(operation.clipId));
      break;
    }
  }
};

// Reverse an operation (used for undo)
export const reverseOperation = (
  operation: Operation,
  dispatch: (action: UnknownAction) => void
) => {
  switch (operation.type) {
    case 'trim': {
      dispatch(
        updateVideoClip({
          clipId: operation.clipId,
          updates: {
            trimStart: operation.previousStart,
            trimEnd: operation.previousEnd,
          },
        })
      );
      break;
    }
    case 'addVideo': {
      dispatch(removeVideoClip(operation.clipId));
      break;
    }
    case 'removeVideo': {
      // For removeVideo undo, we'd need to restore the clip
      // This requires storing the full clip in the operation
      break;
    }
  }
};

// Flag to prevent recording operations during undo/redo
let isUndoRedoInProgress = false;

// Type for the parts of state we need
interface HistoryMiddlewareState {
  project: { project: { timeline: { videoTrack: VideoClip[] } } | null };
  history: {
    past: { operation: Operation }[];
    future: { operation: Operation }[];
  };
}

export const historyMiddleware: Middleware =
  (store) => (next) => (action: unknown) => {
    const typedAction = action as UnknownAction;
    const prevState = store.getState() as HistoryMiddlewareState;

    // Handle undo action
    if (undo.match(typedAction)) {
      const historyState = prevState.history;
      if (historyState.past.length > 0) {
        const lastEntry = historyState.past[historyState.past.length - 1];
        isUndoRedoInProgress = true;
        next(action);
        reverseOperation(lastEntry.operation, store.dispatch);
        isUndoRedoInProgress = false;
        return;
      }
    }

    // Handle redo action
    if (redo.match(typedAction)) {
      const historyState = prevState.history;
      if (historyState.future.length > 0) {
        const nextEntry = historyState.future[0];
        isUndoRedoInProgress = true;
        next(action);
        applyOperation(nextEntry.operation, store.dispatch);
        isUndoRedoInProgress = false;
        return;
      }
    }

    // Capture state before action
    if (updateVideoClip.match(typedAction) && !isUndoRedoInProgress) {
      captureClipState(prevState);
    }

    // Execute the action
    const result = next(action);

    // Skip recording if we're in the middle of undo/redo
    if (isUndoRedoInProgress) {
      return result;
    }

    // Record trim operations
    if (updateVideoClip.match(typedAction)) {
      const { clipId, updates } = typedAction.payload as {
        clipId: string;
        updates: { trimStart?: number; trimEnd?: number };
      };
      const prevClip = previousClipState[clipId];

      if (
        prevClip &&
        (updates.trimStart !== undefined || updates.trimEnd !== undefined)
      ) {
        const operation: Operation = {
          type: 'trim',
          clipId,
          previousStart: prevClip.trimStart,
          previousEnd: prevClip.trimEnd,
          newStart: updates.trimStart ?? prevClip.trimStart,
          newEnd: updates.trimEnd ?? prevClip.trimEnd,
        };

        // Only record if values actually changed
        if (
          operation.previousStart !== operation.newStart ||
          operation.previousEnd !== operation.newEnd
        ) {
          store.dispatch(
            recordOperation({
              operation,
              description: 'Trim clip',
            })
          );
        }
      }
    }

    // Record add video operations
    if (addVideoClip.match(typedAction)) {
      const clip = typedAction.payload as VideoClip;
      const operation: Operation = {
        type: 'addVideo',
        clipId: clip.id,
        sourceFile: clip.sourceFile,
      };

      store.dispatch(
        recordOperation({
          operation,
          description: 'Add video clip',
        })
      );
    }

    // Record remove video operations
    if (removeVideoClip.match(typedAction)) {
      const clipId = typedAction.payload as string;
      const prevClip = previousClipState[clipId];

      if (prevClip) {
        const operation: Operation = {
          type: 'removeVideo',
          clipId,
          sourceFile: prevClip.sourceFile,
        };

        store.dispatch(
          recordOperation({
            operation,
            description: 'Remove video clip',
          })
        );
      }
    }

    return result;
  };
