

import { useCallback, useEffect, useMemo } from 'react';
import { createAudioPlayer } from 'expo-audio';

export function useCallSounds() {

  const dialingPlayer = useMemo(() => {
    const p = createAudioPlayer(require('../../assets/sfx/dialing_soft.m4a'));
    p.loop = true;
    return p;
  }, []);
  const connectPlayer = useMemo(
    () => createAudioPlayer(require('../../assets/sfx/connect.m4a')),
    [],
  );

  useEffect(
    () => () => {
      try { dialingPlayer.remove(); } catch {  }
      try { connectPlayer.remove(); } catch {  }
    },
    [dialingPlayer, connectPlayer],
  );

  const startDialingTone = useCallback(() => {

    console.log(`[Call][flow] +${Date.now()} sound.startDialingTone()`);
    try {

      void dialingPlayer.seekTo(0);
      dialingPlayer.play();
    } catch (err) {
      console.warn("[Call][flow] startDialingTone failed:", err);
    }
  }, [dialingPlayer]);

  const stopDialingTone = useCallback(() => {
    console.log(`[Call][flow] +${Date.now()} sound.stopDialingTone()`);
    try { dialingPlayer.pause(); } catch {  }
  }, [dialingPlayer]);

  const playConnect = useCallback(() => {
    console.log(`[Call][flow] +${Date.now()} sound.playConnect()`);
    try { dialingPlayer.pause(); } catch {  }
    try {
      void connectPlayer.seekTo(0);
      connectPlayer.play();
    } catch (err) {
      console.warn("[Call][flow] playConnect failed:", err);
    }
  }, [dialingPlayer, connectPlayer]);

  return useMemo(
    () => ({ startDialingTone, stopDialingTone, playConnect }),
    [startDialingTone, stopDialingTone, playConnect],
  );
}
