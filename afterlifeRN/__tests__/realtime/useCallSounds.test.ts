
const players: any[] = [];
jest.mock('expo-audio', () => ({
  createAudioPlayer: () => {
    const p = { play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(), remove: jest.fn(), loop: false };
    players.push(p);
    return p;
  },
}));

import { renderHook, act } from '@testing-library/react-native';
import { useCallSounds } from '../../src/realtime/useCallSounds';

beforeEach(() => { players.length = 0; });

it('마운트 후 대기음 player는 loop=true로 설정된다', () => {
  renderHook(() => useCallSounds());
  expect(players[0].loop).toBe(true);
});

it('startDialingTone → 대기음 player play 호출', () => {
  const { result } = renderHook(() => useCallSounds());
  act(() => result.current.startDialingTone());
  expect(players[0].play).toHaveBeenCalled();
});

it('stopDialingTone → 대기음 정지', () => {
  const { result } = renderHook(() => useCallSounds());
  act(() => { result.current.startDialingTone(); result.current.stopDialingTone(); });
  expect(players[0].pause).toHaveBeenCalled();
});

it('playConnect → 대기음 정지 + 연결음 재생', () => {
  const { result } = renderHook(() => useCallSounds());
  act(() => { result.current.startDialingTone(); result.current.playConnect(); });
  expect(players[0].pause).toHaveBeenCalled(); 
  expect(players[1].play).toHaveBeenCalled();  
});
