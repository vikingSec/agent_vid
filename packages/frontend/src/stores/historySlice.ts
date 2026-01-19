import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Operation, HistoryEntry } from '@agent-vid/shared';
import { v4 as uuidv4 } from 'uuid';

interface HistorySliceState {
  // Stack of past operations (for undo)
  past: HistoryEntry[];
  // Stack of future operations (for redo)
  future: HistoryEntry[];
  // Maximum history size
  maxSize: number;
}

const initialState: HistorySliceState = {
  past: [],
  future: [],
  maxSize: 100,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    // Record a new operation (clears redo stack)
    recordOperation: (
      state,
      action: PayloadAction<{ operation: Operation; description?: string }>
    ) => {
      const entry: HistoryEntry = {
        id: uuidv4(),
        operation: action.payload.operation,
        timestamp: new Date().toISOString(),
        description: action.payload.description,
      };

      state.past.push(entry);
      state.future = []; // Clear redo stack on new operation

      // Trim history if it exceeds max size
      if (state.past.length > state.maxSize) {
        state.past = state.past.slice(-state.maxSize);
      }
    },

    // Undo: move latest from past to future
    undo: (state) => {
      if (state.past.length === 0) return;

      const entry = state.past.pop()!;
      state.future.unshift(entry);
    },

    // Redo: move earliest from future to past
    redo: (state) => {
      if (state.future.length === 0) return;

      const entry = state.future.shift()!;
      state.past.push(entry);
    },

    // Clear all history
    clearHistory: (state) => {
      state.past = [];
      state.future = [];
    },

    // Set max history size
    setMaxHistorySize: (state, action: PayloadAction<number>) => {
      state.maxSize = Math.max(1, action.payload);
      if (state.past.length > state.maxSize) {
        state.past = state.past.slice(-state.maxSize);
      }
    },
  },
});

export const {
  recordOperation,
  undo,
  redo,
  clearHistory,
  setMaxHistorySize,
} = historySlice.actions;

// Selectors
export const selectCanUndo = (state: { history: HistorySliceState }) =>
  state.history.past.length > 0;

export const selectCanRedo = (state: { history: HistorySliceState }) =>
  state.history.future.length > 0;

export const selectPastOperations = (state: { history: HistorySliceState }) =>
  state.history.past;

export const selectFutureOperations = (state: { history: HistorySliceState }) =>
  state.history.future;

export default historySlice.reducer;
