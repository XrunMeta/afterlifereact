import { v_0da18b, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_6ee99d, v_f0496e, v_f42541, v_19a43d } from '../typewriter';

describe('advanceReveal (순수 진행 계산)', () => {
  it('target 길이 미만이면 1글자씩 전진', () => {
    expect(v_6ee99d(0, 5)).toBe(1);
    expect(v_6ee99d(3, 5)).toBe(4);
  });

  it('target 끝에 도달하면 정지(no-op)', () => {
    expect(v_6ee99d(5, 5)).toBe(5);
    expect(v_6ee99d(6, 5)).toBe(6); 
  });

  it('targetLength 0 이하면 0', () => {
    expect(v_6ee99d(3, 0)).toBe(0);
  });
});

describe('revealedText', () => {
  it('revealed 만큼 잘라 반환', () => {
    expect(v_f0496e('안녕하세요', 2)).toBe('안녕');
  });

  it('revealed가 target 길이를 넘어도 안전 clamp', () => {
    expect(v_f0496e('안녕', 10)).toBe('안녕');
  });

  it('빈 target은 항상 빈 문자열', () => {
    expect(v_f0496e('', 5)).toBe('');
  });

  describe('서로게이트 페어(이모지) 보정', () => {
    const v_5f5d6d = '안녕😀하이';

    it('페어 중간(high surrogate 직후)에서 끊기면 앞 문자까지만 노출 — 깨진 문자 없음', () => {

      expect(v_f0496e(v_5f5d6d, 3)).toBe('안녕');
    });

    it('페어 전체가 포함되는 지점부터는 이모지가 한 번에 온전히 노출', () => {
      expect(v_f0496e(v_5f5d6d, 4)).toBe('안녕😀');
      expect(v_f0496e(v_5f5d6d, 5)).toBe('안녕😀하');
      expect(v_f0496e(v_5f5d6d, 6)).toBe('안녕😀하이');
    });

    it('reveal이 1씩 진행되는 동안 어떤 시점에도 깨진 문자(외톨이 서로게이트)가 노출되지 않음', () => {
      for (let v_f4e98d = 0; v_f4e98d <= v_5f5d6d.length; v_f4e98d += 1) {
        const v_f11069 = v_f0496e(v_5f5d6d, v_f4e98d);

        if (v_f11069.length > 0) {
          const v_90efd3 = v_f11069.charCodeAt(v_f11069.length - 1);
          expect(v_90efd3 >= 0xd800 && v_90efd3 <= 0xdbff).toBe(false);
        }
      }
    });
  });
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });

describe('useTypewriter (훅)', () => {
  it('글자당 msPerChar 간격으로 점진 표시', () => {
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) => v_f42541(v_b1927c.target),
      { initialProps: { target: '안녕하세요' } },
    );
    expect(v_43c42e.current).toBe('');
    v_be73a0(() => { jest.advanceTimersByTime(v_19a43d); });
    expect(v_43c42e.current).toBe('안');
    v_be73a0(() => { jest.advanceTimersByTime(v_19a43d * 2); });
    expect(v_43c42e.current).toBe('안녕하');
    v_2726cb({ target: '안녕하세요' });
    v_be73a0(() => { jest.advanceTimersByTime(v_19a43d * 10); });
    expect(v_43c42e.current).toBe('안녕하세요'); 
  });

  it('target 연장(새 문장 누적) 시 진행 이어서 계속', () => {
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) => v_f42541(v_b1927c.target),
      { initialProps: { target: '안녕' } },
    );
    v_be73a0(() => { jest.advanceTimersByTime(v_19a43d * 2); });
    expect(v_43c42e.current).toBe('안녕'); 

    v_2726cb({ target: '안녕 반가워요' });
    v_be73a0(() => { jest.advanceTimersByTime(v_19a43d); });
    expect(v_43c42e.current).toBe('안녕 ');
    v_be73a0(() => { jest.advanceTimersByTime(v_19a43d * 10); });
    expect(v_43c42e.current).toBe('안녕 반가워요');
  });

  it('target이 빈 문자열이 되면(speech_end 클리어) revealed 즉시 리셋', () => {
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) => v_f42541(v_b1927c.target),
      { initialProps: { target: '안녕하세요' } },
    );
    v_be73a0(() => { jest.advanceTimersByTime(v_19a43d * 3); });
    expect(v_43c42e.current).toBe('안녕하');
    v_2726cb({ target: '' });
    expect(v_43c42e.current).toBe('');

    v_2726cb({ target: '다시' });
    v_be73a0(() => { jest.advanceTimersByTime(v_19a43d); });
    expect(v_43c42e.current).toBe('다');
  });

  it('언마운트 시 인터벌 정리(unmount 이후 추가 tick 없음)', () => {
    const { result: v_43c42e, unmount: v_67a0e6 } = v_0da18b(() => v_f42541('안녕하세요'));
    v_be73a0(() => { jest.advanceTimersByTime(v_19a43d); });
    expect(v_43c42e.current).toBe('안');
    v_67a0e6();

    expect(() => jest.advanceTimersByTime(v_19a43d * 10)).not.toThrow();
  });

  it('리뷰 fix(Important 2) — 이모지 포함 target 진행 중 매 틱 깨진 문자(외톨이 서로게이트) 미노출', () => {
    const v_5f5d6d = '안녕😀하이';
    const { result: v_43c42e } = v_0da18b(() => v_f42541(v_5f5d6d));
    for (let v_ebec57 = 0; v_ebec57 < v_5f5d6d.length + 2; v_ebec57 += 1) {
      v_be73a0(() => { jest.advanceTimersByTime(v_19a43d); });
      const v_fd5f43 = v_43c42e.current;
      if (v_fd5f43.length > 0) {
        const v_90efd3 = v_fd5f43.charCodeAt(v_fd5f43.length - 1);
        expect(v_90efd3 >= 0xd800 && v_90efd3 <= 0xdbff).toBe(false);
      }
    }
    expect(v_43c42e.current).toBe(v_5f5d6d);
  });
});
