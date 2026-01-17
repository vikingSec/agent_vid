import './Timeline.css';

export function Timeline() {
  return (
    <div className="timeline">
      <div className="timeline-header">
        <span className="timeline-title">Timeline</span>
      </div>
      <div className="timeline-tracks">
        <div className="track video-track">
          <div className="track-label">Video</div>
          <div className="track-content">
            <div className="track-placeholder">No video clips</div>
          </div>
        </div>
        <div className="track audio-track">
          <div className="track-label">Audio</div>
          <div className="track-content">
            <div className="track-placeholder">No audio clips</div>
          </div>
        </div>
        <div className="track text-track">
          <div className="track-label">Text</div>
          <div className="track-content">
            <div className="track-placeholder">No text overlays</div>
          </div>
        </div>
      </div>
    </div>
  );
}
