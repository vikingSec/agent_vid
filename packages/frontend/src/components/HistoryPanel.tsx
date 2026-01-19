import { useCallback } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import {
  undo,
  redo,
  selectCanUndo,
  selectCanRedo,
  selectPastOperations,
  selectFutureOperations,
} from '../stores/historySlice';
import './HistoryPanel.css';

export function HistoryPanel() {
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  const pastOperations = useAppSelector(selectPastOperations);
  const futureOperations = useAppSelector(selectFutureOperations);

  const handleUndo = useCallback(() => {
    dispatch(undo());
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch(redo());
  }, [dispatch]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'trim':
        return '✂️';
      case 'addVideo':
        return '📹';
      case 'removeVideo':
        return '🗑️';
      case 'addText':
        return '📝';
      case 'addAudio':
        return '🎵';
      default:
        return '📌';
    }
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <span className="history-title">History</span>
        <div className="history-controls">
          <button
            className="history-button"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Cmd/Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            className="history-button"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Cmd/Ctrl+Shift+Z)"
          >
            Redo ↪
          </button>
        </div>
      </div>

      <div className="history-list">
        {pastOperations.length === 0 && futureOperations.length === 0 ? (
          <div className="history-empty">No history yet</div>
        ) : (
          <>
            {/* Future operations (grayed out, at top) */}
            {futureOperations.map((entry) => (
              <div key={entry.id} className="history-item history-item-future">
                <span className="history-icon">
                  {getOperationIcon(entry.operation.type)}
                </span>
                <span className="history-description">
                  {entry.description || entry.operation.type}
                </span>
                <span className="history-time">{formatTime(entry.timestamp)}</span>
              </div>
            ))}

            {/* Current state marker */}
            {(pastOperations.length > 0 || futureOperations.length > 0) && (
              <div className="history-current-marker">
                <span className="marker-line" />
                <span className="marker-label">Current</span>
                <span className="marker-line" />
              </div>
            )}

            {/* Past operations (in reverse order, most recent first) */}
            {[...pastOperations].reverse().map((entry) => (
              <div key={entry.id} className="history-item history-item-past">
                <span className="history-icon">
                  {getOperationIcon(entry.operation.type)}
                </span>
                <span className="history-description">
                  {entry.description || entry.operation.type}
                </span>
                <span className="history-time">{formatTime(entry.timestamp)}</span>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="history-shortcuts">
        <span>Undo: Cmd/Ctrl+Z</span>
        <span>Redo: Cmd/Ctrl+Shift+Z</span>
      </div>
    </div>
  );
}
