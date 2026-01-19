import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';
import { VideoUploader } from './components/VideoUploader';
import { HistoryPanel } from './components/HistoryPanel';
import { useUndoRedoShortcuts } from './hooks/useUndoRedoShortcuts';

export function App() {
  // Enable undo/redo keyboard shortcuts globally
  useUndoRedoShortcuts();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Agent Vid</h1>
      </header>
      <main className="app-main">
        <div className="editor-layout">
          <aside className="sidebar">
            <VideoUploader />
            <HistoryPanel />
          </aside>
          <div className="editor-container">
            <VideoPlayer />
            <Timeline />
          </div>
        </div>
      </main>
    </div>
  );
}
