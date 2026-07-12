import { v_d89c6c } from '../../src/face/enrollCardTiming';
import type { v_3f42e4 } from '../../src/realtime/handsFree';

describe('canRevealEnrollCard', () => {
  it('reveals only when phase is listening (내 차례·클론 조용)', () => {
    expect(v_d89c6c('listening')).toBe(true);
  });

  it('defers while clone is busy or not user turn', () => {
    const deferPhases: v_3f42e4[] = [
      'idle', 'greeting', 'confirming', 'sending', 'speaking', 'paused',
    ];
    for (const v_e2a85c of v_b22e5b) {
      expect(v_d89c6c(v_e2a85c)).toBe(false);
    }
  });
});
