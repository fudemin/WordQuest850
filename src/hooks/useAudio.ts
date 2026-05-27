import { useCallback, useState } from 'react';
import { playWord, stopAudio } from '../services/audioService';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(async (wordId: string, ttsUrl?: string) => {
    setIsPlaying(true);
    try {
      await playWord(wordId, ttsUrl);
    } finally {
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(async () => {
    await stopAudio();
    setIsPlaying(false);
  }, []);

  return { play, stop, isPlaying };
}
