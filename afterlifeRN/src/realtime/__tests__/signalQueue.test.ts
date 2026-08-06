
import { appendSignal, takeNewSignals, nextCursor, SIGNAL_QUEUE_MAX } from '../signalQueue';
import type { SpeechSignal } from '../avatarCall';

const sig = (id: number, type: SpeechSignal['type'] = 'speech_text'): SpeechSignal =>
  ({ id, type, ts: id });

describe('appendSignal', () => {
  it('항상 새 배열을 만든다(참조 변화 = 소비자 effect 트리거)', () => {
    const a: SpeechSignal[] = [];
    const b = appendSignal(a, sig(1));
    expect(b).not.toBe(a);
    expect(b.map((s) => s.id)).toEqual([1]);
  });

  it('상한을 넘으면 오래된 것부터 버린다(최신 SIGNAL_QUEUE_MAX 유지)', () => {
    let q: SpeechSignal[] = [];
    for (let i = 1; i <= SIGNAL_QUEUE_MAX + 5; i += 1) q = appendSignal(q, sig(i));
    expect(q).toHaveLength(SIGNAL_QUEUE_MAX);
    expect(q[0].id).toBe(6);
    expect(q[q.length - 1].id).toBe(SIGNAL_QUEUE_MAX + 5);
  });
});

describe('takeNewSignals', () => {
  it('커서 이후의 신호를 도착 순서대로 전부 돌려준다(같은 tick 배치 유실 0)', () => {
    const q = [sig(1, 'speech_start'), sig(2), sig(3), sig(4, 'speech_end')];
    expect(takeNewSignals(q, 0).map((s) => s.id)).toEqual([1, 2, 3, 4]);
    expect(takeNewSignals(q, 2).map((s) => s.id)).toEqual([3, 4]);
  });

  it('신규가 없으면 항상 같은 빈 배열(불필요한 리렌더 방지)', () => {
    const q = [sig(1), sig(2)];
    const a = takeNewSignals(q, 2);
    const b = takeNewSignals(q, 5);
    expect(a).toHaveLength(0);
    expect(a).toBe(b);
  });

  it('큐가 null/undefined/빈배열이어도 안전', () => {
    expect(takeNewSignals(null, 0)).toHaveLength(0);
    expect(takeNewSignals(undefined, 0)).toHaveLength(0);
    expect(takeNewSignals([], 0)).toHaveLength(0);
  });

  it('전부 신규면 원본 배열을 그대로 돌려준다(복사 없음)', () => {
    const q = [sig(1), sig(2)];
    expect(takeNewSignals(q, 0)).toBe(q);
  });

  it('큐가 상한으로 잘려 커서보다 뒤쪽만 남아도 남은 신규만 준다(index 커서 방식의 함정 회피)', () => {
    const q = [sig(10), sig(11), sig(12)];
    expect(takeNewSignals(q, 11).map((s) => s.id)).toEqual([12]);
  });
});

describe('nextCursor', () => {
  it('소비한 묶음의 마지막 id 를 준다', () => {
    expect(nextCursor([sig(3), sig(7)], 0)).toBe(7);
  });
  it('빈 묶음이면 현재 커서를 유지한다', () => {
    expect(nextCursor([], 4)).toBe(4);
  });
});
