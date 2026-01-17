# Project Handoff - Agent Vid

**Date:** January 16, 2026
**Branch:** `issue-4-video-loading`
**PR:** https://github.com/vikingSec/agent_vid/pull/17

---

## What's Been Done

### Phase 1 (Complete)
- **Issue #1:** Monorepo setup with pnpm workspaces
- **Issue #2:** React frontend scaffold with Vite
- **Issue #3:** Node.js backend scaffold with Express

### Phase 2 (Complete - Pending PR Review)
- **Issue #4:** Video Loading and Playback
  - Video upload (drag-drop, file browser)
  - Video loading from URL
  - Backend video storage with FFmpeg metadata extraction
  - Thumbnail generation
  - Redux state management
  - Play/pause, seeking, volume controls

- **Issue #5:** Video Trimming
  - TimeRuler with zoom-aware tick marks
  - VideoClipComponent for timeline rendering
  - TrimHandle for draggable trim controls
  - Timeline with playhead, zoom (Ctrl/Cmd+scroll or +/- buttons)
  - I/O keyboard shortcuts for in/out points
  - Loop playback within trim region
  - Trim overlay on progress bar

- **Issue #6:** History System (Basic)
  - historySlice for undo/redo state
  - historyMiddleware for auto-capturing operations
  - HistoryPanel UI component
  - Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo)

### Bug Fixes
- Fixed undo not restoring timeline clip length (TrimOperation now stores both trim points AND timeline position)

---

## Current State

The app now supports:
1. Upload a video → appears in player and timeline
2. Click clip → shows trim handles
3. Drag handles or press I/O → adjusts trim points
4. Undo/redo works correctly for trim operations
5. History panel shows all operations

**To test locally:**
```bash
pnpm install
pnpm dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

---

## What's Next

### Phase 3: Text & Audio
- **Issue #7:** Text overlays (text editor, position/timing, FFmpeg burn-in)
- **Issue #8:** Audio tracks (audio timeline, upload, mixing)

### Phase 4: Agent Integration
- **Issue #9:** MCP server setup
- **Issue #10:** Core MCP tools (load_video, trim_clip, add_text, add_audio)
- **Issue #11:** History MCP tools (undo, redo, create_branch, checkout_branch)

### Phase 5: Polish
- **Issue #12:** Branch visualization (history tree UI, diff view)
- **Issue #13:** Final render pipeline (queue, progress, download)

---

## Key Files to Know

### Frontend
| File | Purpose |
|------|---------|
| `src/stores/videoSlice.ts` | Video playback state, upload thunks |
| `src/stores/projectSlice.ts` | Project/timeline state, clip CRUD |
| `src/stores/historySlice.ts` | Undo/redo state |
| `src/stores/historyMiddleware.ts` | Auto-captures operations for history |
| `src/hooks/useTrimming.ts` | Trim state management |
| `src/components/Timeline.tsx` | Main timeline with clips, ruler, playhead |
| `src/components/VideoPlayer.tsx` | Video player with trim overlay |

### Backend
| File | Purpose |
|------|---------|
| `src/routes/videos.ts` | Video upload/streaming API |
| `src/storage/videos.ts` | VideoStorage class, FFmpeg metadata |

### Shared Types
| File | Purpose |
|------|---------|
| `types/video.ts` | VideoMetadata interface |
| `types/project.ts` | Project, Timeline, VideoClip, etc. |
| `types/operations.ts` | Operation types for history |
| `types/history.ts` | HistoryBranch, HistoryEntry |

---

## Lessons Learned

### 1. Redux Middleware Circular Dependencies
When creating middleware that imports from `store.ts`, you can't import `RootState` because store imports the middleware. Solution: define inline types for the state shape you need.

### 2. TrimOperation Needs Full State
Initially only stored `trimStart`/`trimEnd`, but clip visual length is determined by `startTime`/`endTime`. Always capture the full state needed to restore the exact previous condition.

### 3. TypeScript with fluent-ffmpeg
Import types directly: `import ffmpeg, { type FfprobeData } from 'fluent-ffmpeg'`. The `FfprobeData` type handles the nullable duration/size fields properly.

### 4. Express Router Type Inference
If you get "cannot be named without reference" errors, add `"declaration": false` to tsconfig.json.

---

## Open Questions / Decisions for Later

1. **FFmpeg.wasm for preview** - Listed in plan but deferred. Currently using native video playback with in-memory trim state. May want FFmpeg.wasm for actual trim preview generation.

2. **Add Video undo** - Currently `addVideo` undo just removes the clip, but doesn't restore if you undo the removal. Would need to store full clip data in operation.

3. **Git-like branching** - The history types support branches but UI only shows linear undo/redo. Branch visualization is Issue #12.

---

## Git Status

```
Branch: issue-4-video-loading
Commits ahead of main: 4
  - Implement video loading and playback (Issue #4)
  - Implement video trimming (Issue #5)
  - Implement basic history system (Issue #6)
  - Fix undo not restoring timeline clip length
```

PR #17 contains all Phase 2 work and is ready for review.
