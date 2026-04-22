import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BallPosition {
  x: number;
  y: number;
}

const KEY = '@afterlifeRN/devBall/pos';
const DEFAULT: BallPosition = { x: 0, y: 200 };

export function useFloatingBallPosition() {
  const [pos, setPos] = useState<BallPosition>(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setPos(JSON.parse(raw));
        } catch {

        }
      }
    });
  }, []);

  const save = async (p: BallPosition) => {
    setPos(p);
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  };

  return { pos, save };
}
