import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Agent Vid</h1>
      </header>
      <main className="app-main">
        <div className="editor-container">
          <VideoPlayer />
          <Timeline />
        </div>
      </main>
    </div>
  );
}
