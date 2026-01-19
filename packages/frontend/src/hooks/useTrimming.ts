import { useState, useCallback } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { updateVideoClip, selectClip } from '../stores/projectSlice';
import type { VideoClip } from '@agent-vid/shared';

interface TrimState {
  isActive: boolean;
  side: 'left' | 'right' | null;
  clipId: string | null;
  originalClip: VideoClip | null;
}

export function useTrimming() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project.project);
  const selectedClipId = useAppSelector((state) => state.project.selectedClipId);
  const loadedVideos = useAppSelector((state) => state.video.loadedVideos);

  const [trimState, setTrimState] = useState<TrimState>({
    isActive: false,
    side: null,
    clipId: null,
    originalClip: null,
  });

  const selectedClip = project?.timeline.videoTrack.find(
    (c) => c.id === selectedClipId
  );

  const getClipMetadata = useCallback(
    (sourceFile: string) => loadedVideos[sourceFile],
    [loadedVideos]
  );

  const startTrim = useCallback(
    (clipId: string, side: 'left' | 'right') => {
      const clip = project?.timeline.videoTrack.find((c) => c.id === clipId);
      if (!clip) return;

      setTrimState({
        isActive: true,
        side,
        clipId,
        originalClip: { ...clip },
      });
    },
    [project]
  );

  const updateTrim = useCallback(
    (side: 'left' | 'right', deltaTime: number) => {
      if (!trimState.isActive || !trimState.clipId || !trimState.originalClip)
        return;

      const clip = project?.timeline.videoTrack.find(
        (c) => c.id === trimState.clipId
      );
      if (!clip) return;

      const metadata = getClipMetadata(clip.sourceFile);
      const sourceDuration = metadata?.duration || clip.trimEnd;

      if (side === 'left') {
        // Adjust start time and trim start
        const newTrimStart = Math.max(0, clip.trimStart + deltaTime);
        const maxTrimStart = clip.trimEnd - 0.1; // Keep at least 0.1s

        dispatch(
          updateVideoClip({
            clipId: clip.id,
            updates: {
              trimStart: Math.min(newTrimStart, maxTrimStart),
              startTime: clip.startTime + deltaTime,
            },
          })
        );
      } else {
        // Adjust end time and trim end
        const newTrimEnd = Math.min(sourceDuration, clip.trimEnd + deltaTime);
        const minTrimEnd = clip.trimStart + 0.1; // Keep at least 0.1s

        dispatch(
          updateVideoClip({
            clipId: clip.id,
            updates: {
              trimEnd: Math.max(newTrimEnd, minTrimEnd),
              endTime: clip.endTime + deltaTime,
            },
          })
        );
      }
    },
    [trimState, project, dispatch, getClipMetadata]
  );

  const endTrim = useCallback(() => {
    setTrimState({
      isActive: false,
      side: null,
      clipId: null,
      originalClip: null,
    });
  }, []);

  const setTrimIn = useCallback(
    (time: number) => {
      if (!selectedClip) return;

      const minTime = 0;
      const maxTime = selectedClip.trimEnd - 0.1;
      const clampedTime = Math.max(minTime, Math.min(time, maxTime));

      // Calculate the time difference for startTime adjustment
      const timeDiff = clampedTime - selectedClip.trimStart;

      dispatch(
        updateVideoClip({
          clipId: selectedClip.id,
          updates: {
            trimStart: clampedTime,
            startTime: selectedClip.startTime + timeDiff,
          },
        })
      );
    },
    [selectedClip, dispatch]
  );

  const setTrimOut = useCallback(
    (time: number) => {
      if (!selectedClip) return;

      const metadata = getClipMetadata(selectedClip.sourceFile);
      const maxTime = metadata?.duration || selectedClip.trimEnd;
      const minTime = selectedClip.trimStart + 0.1;
      const clampedTime = Math.max(minTime, Math.min(time, maxTime));

      // Calculate the time difference for endTime adjustment
      const timeDiff = clampedTime - selectedClip.trimEnd;

      dispatch(
        updateVideoClip({
          clipId: selectedClip.id,
          updates: {
            trimEnd: clampedTime,
            endTime: selectedClip.endTime + timeDiff,
          },
        })
      );
    },
    [selectedClip, dispatch, getClipMetadata]
  );

  const selectVideoClip = useCallback(
    (clipId: string | null) => {
      dispatch(selectClip(clipId));
    },
    [dispatch]
  );

  return {
    selectedClip,
    selectedClipId,
    trimState,
    startTrim,
    updateTrim,
    endTrim,
    setTrimIn,
    setTrimOut,
    selectVideoClip,
    getClipMetadata,
  };
}
