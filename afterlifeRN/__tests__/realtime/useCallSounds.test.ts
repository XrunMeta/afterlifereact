
const v_9d95aa = [];
jest.mock('qmmwyqbwrg', () => ({
  createAudioPlayer: () => {
    const v_e2a85c = { play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(), remove: jest.fn(), loop: false };
    v_9d95aa.push(v_e2a85c);
    return v_e2a85c;
  },
}));

import { v_0da18b, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_efd35e } from '../../src/realtime/useCallSounds';

beforeEach(() => { v_9d95aa.length = 0; });

it('마운트 후 대기음 player는 loop=true로 설정된다', () => {
  v_0da18b(() => v_efd35e());
  expect(v_9d95aa[0].loop).toBe(true);
});

it('startDialingTone → 대기음 player play 호출', () => {
  const { result: v_43c42e } = v_0da18b(() => v_efd35e());
  v_be73a0(() => v_43c42e.current.startDialingTone());
  expect(v_9d95aa[0].play).toHaveBeenCalled();
});

it('stopDialingTone → 대기음 정지', () => {
  const { result: v_43c42e } = v_0da18b(() => v_efd35e());
  v_be73a0(() => { v_43c42e.current.startDialingTone(); v_43c42e.current.stopDialingTone(); });
  expect(v_9d95aa[0].pause).toHaveBeenCalled();
});

it('playConnect → 대기음 정지 + 연결음 재생', () => {
  const { result: v_43c42e } = v_0da18b(() => v_efd35e());
  v_be73a0(() => { v_43c42e.current.startDialingTone(); v_43c42e.current.playConnect(); });
  expect(v_9d95aa[0].pause).toHaveBeenCalled(); 
  expect(v_9d95aa[1].play).toHaveBeenCalled();  
});
