
import { v_020651, v_526a29, v_64f859, v_241565 } from '../signalQueue';
import type { v_9d43cd } from '../avatarCall';

const v_f2c979 = (v_389afb, type: v_9d43cd['type'] = 'speech_text'): v_9d43cd =>
  ({ id: v_389afb, type: v_3b27d9, ts: v_389afb });

describe('appendSignal', () => {
  it('항상 새 배열을 만든다(참조 변화 = 소비자 effect 트리거)', () => {
    const a: v_9d43cd[] = [];
    const v_148ff6 = v_020651(v_779914, v_f2c979(1));
    expect(v_148ff6).not.toBe(v_779914);
    expect(v_148ff6.map((v_fd5f43) => v_fd5f43.id)).toEqual([1]);
  });

  it('상한을 넘으면 오래된 것부터 버린다(최신 SIGNAL_QUEUE_MAX 유지)', () => {
    let q: v_9d43cd[] = [];
    for (let v_ebec57 = 1; v_ebec57 <= v_241565 + 5; v_ebec57 += 1) v_ab6401 = v_020651(v_ab6401, v_f2c979(v_ebec57));
    expect(v_ab6401).toHaveLength(v_241565);
    expect(v_ab6401[0].id).toBe(6);
    expect(v_ab6401[v_ab6401.length - 1].id).toBe(v_241565 + 5);
  });
});

describe('takeNewSignals', () => {
  it('커서 이후의 신호를 도착 순서대로 전부 돌려준다(같은 tick 배치 유실 0)', () => {
    const v_ab6401 = [v_f2c979(1, 'speech_start'), v_f2c979(2), v_f2c979(3), v_f2c979(4, 'speech_end')];
    expect(v_526a29(v_ab6401, 0).map((v_fd5f43) => v_fd5f43.id)).toEqual([1, 2, 3, 4]);
    expect(v_526a29(v_ab6401, 2).map((v_fd5f43) => v_fd5f43.id)).toEqual([3, 4]);
  });

  it('신규가 없으면 항상 같은 빈 배열(불필요한 리렌더 방지)', () => {
    const v_ab6401 = [v_f2c979(1), v_f2c979(2)];
    const v_779914 = v_526a29(v_ab6401, 2);
    const v_148ff6 = v_526a29(v_ab6401, 5);
    expect(v_779914).toHaveLength(0);
    expect(v_779914).toBe(v_148ff6);
  });

  it('큐가 null/undefined/빈배열이어도 안전', () => {
    expect(v_526a29(null, 0)).toHaveLength(0);
    expect(v_526a29(undefined, 0)).toHaveLength(0);
    expect(v_526a29([], 0)).toHaveLength(0);
  });

  it('전부 신규면 원본 배열을 그대로 돌려준다(복사 없음)', () => {
    const v_ab6401 = [v_f2c979(1), v_f2c979(2)];
    expect(v_526a29(v_ab6401, 0)).toBe(v_ab6401);
  });

  it('큐가 상한으로 잘려 커서보다 뒤쪽만 남아도 남은 신규만 준다(index 커서 방식의 함정 회피)', () => {
    const v_ab6401 = [v_f2c979(10), v_f2c979(11), v_f2c979(12)];
    expect(v_526a29(v_ab6401, 11).map((v_fd5f43) => v_fd5f43.id)).toEqual([12]);
  });
});

describe('nextCursor', () => {
  it('소비한 묶음의 마지막 id 를 준다', () => {
    expect(v_64f859([v_f2c979(3), v_f2c979(7)], 0)).toBe(7);
  });
  it('빈 묶음이면 현재 커서를 유지한다', () => {
    expect(v_64f859([], 4)).toBe(4);
  });
});
