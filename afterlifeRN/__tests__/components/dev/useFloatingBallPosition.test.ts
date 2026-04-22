import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFloatingBallPosition } from '../../../src/components/dev/useFloatingBallPosition';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('loads default position on first mount', () => {
  const { result } = renderHook(() => useFloatingBallPosition());
  expect(result.current.pos).toEqual({ x: 0, y: 200 });
});

test('persists updated position', async () => {
  const { result } = renderHook(() => useFloatingBallPosition());
  await act(async () => {
    await result.current.save({ x: 50, y: 100 });
  });
  const raw = await AsyncStorage.getItem('@afterlifeRN/devBall/pos');
  expect(raw).toBe(JSON.stringify({ x: 50, y: 100 }));
  expect(result.current.pos).toEqual({ x: 50, y: 100 });
});

test('hydrates saved position from storage on mount', async () => {
  await AsyncStorage.setItem(
    '@afterlifeRN/devBall/pos',
    JSON.stringify({ x: 999, y: 42 }),
  );
  const { result } = renderHook(() => useFloatingBallPosition());
  await waitFor(() => {
    expect(result.current.pos).toEqual({ x: 999, y: 42 });
  });
});
