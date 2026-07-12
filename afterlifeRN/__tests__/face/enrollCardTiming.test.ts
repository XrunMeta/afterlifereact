import { canRevealEnrollCard } from '../../src/face/enrollCardTiming';
import type { HandsFreePhase } from '../../src/realtime/handsFree';

describe('canRevealEnrollCard', () => {
  it('reveals only when phase is listening (내 차례·클론 조용)', () => {
    expect(canRevealEnrollCard('listening')).toBe(true);
  });

  it('defers while clone is busy or not user turn', () => {
    const deferPhases: HandsFreePhase[] = [
      'idle', 'greeting', 'confirming', 'sending', 'speaking', 'paused',
    ];
    for (const p of deferPhases) {
      expect(canRevealEnrollCard(p)).toBe(false);
    }
  });
});
