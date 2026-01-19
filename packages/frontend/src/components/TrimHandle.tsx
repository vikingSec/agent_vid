import { useCallback, useRef } from 'react';
import './TrimHandle.css';

interface TrimHandleProps {
  side: 'left' | 'right';
  position: number; // pixels from left
  onDrag: (deltaPixels: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export function TrimHandle({
  side,
  position,
  onDrag,
  onDragStart,
  onDragEnd,
}: TrimHandleProps) {
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
      lastXRef.current = e.clientX;
      onDragStart();

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const delta = e.clientX - lastXRef.current;
        lastXRef.current = e.clientX;
        onDrag(delta);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        onDragEnd();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [onDrag, onDragStart, onDragEnd]
  );

  return (
    <div
      className={`trim-handle trim-handle-${side}`}
      style={{ [side]: position }}
      onMouseDown={handleMouseDown}
    >
      <div className="trim-handle-grip">
        <div className="trim-handle-line" />
        <div className="trim-handle-line" />
        <div className="trim-handle-line" />
      </div>
    </div>
  );
}
