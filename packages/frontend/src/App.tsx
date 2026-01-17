import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';
import { VideoUploader } from './components/VideoUploader';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Agent Vid</h1>
      </header>
      <main className="app-main">
        <div className="editor-layout">
          <aside className="sidebar">
            <VideoUploader />
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
