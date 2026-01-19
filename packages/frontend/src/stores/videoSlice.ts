import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { VideoMetadata } from '@agent-vid/shared';

interface VideoState {
  // Loaded videos (source files)
  loadedVideos: Record<string, VideoMetadata>;

  // Playback state
  currentVideoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;

  // Loading state
  isLoading: boolean;
  uploadProgress: number;
  error: string | null;

  // FFmpeg.wasm state
  ffmpegReady: boolean;
  ffmpegLoading: boolean;
}

const initialState: VideoState = {
  loadedVideos: {},
  currentVideoId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  isLoading: false,
  uploadProgress: 0,
  error: null,
  ffmpegReady: false,
  ffmpegLoading: false,
};

// Async thunk for uploading video file
export const uploadVideo = createAsyncThunk(
  'video/upload',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Upload failed');
      }

      const data = await response.json();
      return data.video as VideoMetadata;
    } catch (error) {
      return rejectWithValue('Network error during upload');
    }
  }
);

// Async thunk for loading video from URL
export const loadVideoFromUrl = createAsyncThunk(
  'video/loadFromUrl',
  async (url: string, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/videos/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to load video');
      }

      const data = await response.json();
      return data.video as VideoMetadata;
    } catch (error) {
      return rejectWithValue('Network error loading video');
    }
  }
);

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setCurrentVideo: (state, action: PayloadAction<string | null>) => {
      state.currentVideoId = action.payload;
      if (action.payload && state.loadedVideos[action.payload]) {
        state.duration = state.loadedVideos[action.payload].duration;
      }
      state.currentTime = 0;
      state.isPlaying = false;
    },
    setPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = Math.max(0, Math.min(1, action.payload));
    },
    setMuted: (state, action: PayloadAction<boolean>) => {
      state.muted = action.payload;
    },
    setFFmpegReady: (state, action: PayloadAction<boolean>) => {
      state.ffmpegReady = action.payload;
      state.ffmpegLoading = false;
    },
    setFFmpegLoading: (state, action: PayloadAction<boolean>) => {
      state.ffmpegLoading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearVideo: (state, action: PayloadAction<string>) => {
      delete state.loadedVideos[action.payload];
      if (state.currentVideoId === action.payload) {
        state.currentVideoId = null;
        state.currentTime = 0;
        state.duration = 0;
        state.isPlaying = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload video
      .addCase(uploadVideo.pending, (state) => {
        state.isLoading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadVideo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.uploadProgress = 100;
        state.loadedVideos[action.payload.id] = action.payload;
        state.currentVideoId = action.payload.id;
        state.duration = action.payload.duration;
        state.currentTime = 0;
      })
      .addCase(uploadVideo.rejected, (state, action) => {
        state.isLoading = false;
        state.uploadProgress = 0;
        state.error = action.payload as string;
      })
      // Load from URL
      .addCase(loadVideoFromUrl.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadVideoFromUrl.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loadedVideos[action.payload.id] = action.payload;
        state.currentVideoId = action.payload.id;
        state.duration = action.payload.duration;
        state.currentTime = 0;
      })
      .addCase(loadVideoFromUrl.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentVideo,
  setPlaying,
  setCurrentTime,
  setDuration,
  setVolume,
  setMuted,
  setFFmpegReady,
  setFFmpegLoading,
  clearError,
  clearVideo,
} = videoSlice.actions;

export default videoSlice.reducer;
