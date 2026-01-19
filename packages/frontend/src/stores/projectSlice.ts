import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Project, VideoClip } from '@agent-vid/shared';

interface ProjectState {
  // Current project
  project: Project | null;

  // UI state
  selectedClipId: string | null;
  timelineZoom: number; // pixels per second
  timelineScrollPosition: number;

  // Saving state
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: string | null;
  hasUnsavedChanges: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  project: null,
  selectedClipId: null,
  timelineZoom: 50, // 50 pixels per second default
  timelineScrollPosition: 0,
  isLoading: false,
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  error: null,
};

// Async thunk for loading a project
export const loadProject = createAsyncThunk(
  'project/load',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to load project');
      }
      return (await response.json()) as Project;
    } catch (error) {
      return rejectWithValue('Network error loading project');
    }
  }
);

// Async thunk for creating a project
export const createProject = createAsyncThunk(
  'project/create',
  async (name: string, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to create project');
      }
      return (await response.json()) as Project;
    } catch (error) {
      return rejectWithValue('Network error creating project');
    }
  }
);

// Async thunk for saving a project
export const saveProject = createAsyncThunk(
  'project/save',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { project: ProjectState };
    const project = state.project.project;
    if (!project) {
      return rejectWithValue('No project to save');
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to save project');
      }
      return (await response.json()) as Project;
    } catch (error) {
      return rejectWithValue('Network error saving project');
    }
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    // Add a video clip to the timeline
    addVideoClip: (state, action: PayloadAction<VideoClip>) => {
      if (state.project) {
        state.project.timeline.videoTrack.push(action.payload);
        // Update timeline duration if this clip extends it
        const clipEnd = action.payload.endTime;
        if (clipEnd > state.project.timeline.duration) {
          state.project.timeline.duration = clipEnd;
        }
        state.hasUnsavedChanges = true;
      }
    },

    // Update a video clip (e.g., for trimming)
    updateVideoClip: (
      state,
      action: PayloadAction<{ clipId: string; updates: Partial<VideoClip> }>
    ) => {
      if (state.project) {
        const clip = state.project.timeline.videoTrack.find(
          (c) => c.id === action.payload.clipId
        );
        if (clip) {
          Object.assign(clip, action.payload.updates);
          state.hasUnsavedChanges = true;
        }
      }
    },

    // Remove a video clip
    removeVideoClip: (state, action: PayloadAction<string>) => {
      if (state.project) {
        state.project.timeline.videoTrack = state.project.timeline.videoTrack.filter(
          (c) => c.id !== action.payload
        );
        if (state.selectedClipId === action.payload) {
          state.selectedClipId = null;
        }
        state.hasUnsavedChanges = true;
      }
    },

    // Select a clip
    selectClip: (state, action: PayloadAction<string | null>) => {
      state.selectedClipId = action.payload;
    },

    // Timeline UI controls
    setTimelineZoom: (state, action: PayloadAction<number>) => {
      state.timelineZoom = Math.max(10, Math.min(200, action.payload));
    },

    setTimelineScrollPosition: (state, action: PayloadAction<number>) => {
      state.timelineScrollPosition = action.payload;
    },

    // Clear project
    clearProject: (state) => {
      state.project = null;
      state.selectedClipId = null;
      state.hasUnsavedChanges = false;
      state.lastSaved = null;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load project
      .addCase(loadProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.project = action.payload;
        state.hasUnsavedChanges = false;
      })
      .addCase(loadProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create project
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.project = action.payload;
        state.hasUnsavedChanges = false;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Save project
      .addCase(saveProject.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(saveProject.fulfilled, (state, action) => {
        state.isSaving = false;
        state.project = action.payload;
        state.hasUnsavedChanges = false;
        state.lastSaved = new Date().toISOString();
      })
      .addCase(saveProject.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addVideoClip,
  updateVideoClip,
  removeVideoClip,
  selectClip,
  setTimelineZoom,
  setTimelineScrollPosition,
  clearProject,
  clearError,
} = projectSlice.actions;

export default projectSlice.reducer;
