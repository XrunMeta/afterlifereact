import { renderHook, act } from '@testing-library/react-native';
import { advanceReveal, revealedText, useTypewriter, TYPEWRITER_MS_PER_CHAR } from '../typewriter';

describe('advanceReveal (순수 진행 계산)', () => {
  it('target 길이 미만이면 1글자씩 전진', () => {
    expect(advanceReveal(0, 5)).toBe(1);
    expect(advanceReveal(3, 5)).toBe(4);
  });

  it('target 끝에 도달하면 정지(no-op)', () => {
    expect(advanceReveal(5, 5)).toBe(5);
    expect(advanceReveal(6, 5)).toBe(6); 
  });

  it('targetLength 0 이하면 0', () => {
    expect(advanceReveal(3, 0)).toBe(0);
  });
});

describe('revealedText', () => {
  it('revealed 만큼 잘라 반환', () => {
    expect(revealedText('안녕하세요', 2)).toBe('안녕');
  });

  it('revealed가 target 길이를 넘어도 안전 clamp', () => {
    expect(revealedText('안녕', 10)).toBe('안녕');
  });

  it('빈 target은 항상 빈 문자열', () => {
    expect(revealedText('', 5)).toBe('');
  });

  describe('서로게이트 페어(이모지) 보정', () => {
    const target = '안녕😀하이';

    it('페어 중간(high surrogate 직후)에서 끊기면 앞 문자까지만 노출 — 깨진 문자 없음', () => {

      expect(revealedText(target, 3)).toBe('안녕');
    });

    it('페어 전체가 포함되는 지점부터는 이모지가 한 번에 온전히 노출', () => {
      expect(revealedText(target, 4)).toBe('안녕😀');
      expect(revealedText(target, 5)).toBe('안녕😀하');
      expect(revealedText(target, 6)).toBe('안녕😀하이');
    });

    it('reveal이 1씩 진행되는 동안 어떤 시점에도 깨진 문자(외톨이 서로게이트)가 노출되지 않음', () => {
      for (let n = 0; n <= target.length; n += 1) {
        const revealed = revealedText(target, n);

        if (revealed.length > 0) {
          const lastCode = revealed.charCodeAt(revealed.length - 1);
          expect(lastCode >= 0xd800 && lastCode <= 0xdbff).toBe(false);
        }
      }
    });
  });
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });

describe('useTypewriter (훅)', () => {
  it('글자당 msPerChar 간격으로 점진 표시', () => {
    const { result, rerender } = renderHook(
      (props: { target: string }) => useTypewriter(props.target),
      { initialProps: { target: '안녕하세요' } },
    );
    expect(result.current).toBe('');
    act(() => { jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR); });
    expect(result.current).toBe('안');
    act(() => { jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR * 2); });
    expect(result.current).toBe('안녕하');
    rerender({ target: '안녕하세요' });
    act(() => { jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR * 10); });
    expect(result.current).toBe('안녕하세요'); 
  });

  it('target 연장(새 문장 누적) 시 진행 이어서 계속', () => {
    const { result, rerender } = renderHook(
      (props: { target: string }) => useTypewriter(props.target),
      { initialProps: { target: '안녕' } },
    );
    act(() => { jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR * 2); });
    expect(result.current).toBe('안녕'); 

    rerender({ target: '안녕 반가워요' });
    act(() => { jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR); });
    expect(result.current).toBe('안녕 ');
    act(() => { jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR * 10); });
    expect(result.current).toBe('안녕 반가워요');
  });

  it('target이 빈 문자열이 되면(speech_end 클리어) revealed 즉시 리셋', () => {
    const { result, rerender } = renderHook(
      (props: { target: string }) => useTypewriter(props.target),
      { initialProps: { target: '안녕하세요' } },
    );
    act(() => { jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR * 3); });
    expect(result.current).toBe('안녕하');
    rerender({ target: '' });
    expect(result.current).toBe('');

    rerender({ target: '다시' });
    act(() => { jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR); });
    expect(result.current).toBe('다');
  });

  it('언마운트 시 인터벌 정리(unmount 이후 추가 tick 없음)', () => {
    const { result, unmount } = renderHook(() => useTypewriter('안녕하세요'));
    act(() => { jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR); });
    expect(result.current).toBe('안');
    unmount();

    expect(() => jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR * 10)).not.toThrow();
  });

  it('리뷰 fix(Important 2) — 이모지 포함 target 진행 중 매 틱 깨진 문자(외톨이 서로게이트) 미노출', () => {
    const target = '안녕😀하이';
    const { result } = renderHook(() => useTypewriter(target));
    for (let i = 0; i < target.length + 2; i += 1) {
      act(() => { jest.advanceTimersByTime(TYPEWRITER_MS_PER_CHAR); });
      const s = result.current;
      if (s.length > 0) {
        const lastCode = s.charCodeAt(s.length - 1);
        expect(lastCode >= 0xd800 && lastCode <= 0xdbff).toBe(false);
      }
    }
    expect(result.current).toBe(target);
  });
});
