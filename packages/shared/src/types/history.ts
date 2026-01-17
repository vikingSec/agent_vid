/**
 * History system types for git-like branching
 */

import type { Operation } from './operations.js';

export interface HistoryBranch {
  name: string;
  operations: HistoryEntry[];
  parent?: BranchParent;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  operation: Operation;
  timestamp: string;
  description?: string;
}

export interface BranchParent {
  branch: string;
  entryIndex: number;
}

export interface HistoryState {
  branches: HistoryBranch[];
  currentBranch: string;
  currentIndex: number;
}
