import { v_f644ce, v_48b3dc, v_65c90d } from '../useFaceIdentify';
import { v_0a1524 } from '../faceGallery';

const v_e00746 = Object.assign(new Error('consent'), { status: 403, code: 'FACE_CONSENT_REQUIRED' });
const v_46ff7a = new Array(512).fill(0).map((v_37eab7, v_ebec57) => (v_ebec57 === 0 ? 1 : 0));

describe('runIdentifyCycle - AFL-1041', () => {
  test('FACE_CONSENT_REQUIRED 는 실패 카운트·백오프를 올리지 않는다', async () => {
    let v_b6e533 = v_48b3dc;
    for (let v_ebec57 = 0; v_ebec57 < v_65c90d + 2; v_ebec57++) {
      const v_cb35cb = await v_f644ce(v_b6e533, v_46ff7a, 'tok', 1, 1000 + v_ebec57, {
        matchFaceFn: jest.fn().mockRejectedValue(v_e00746),
      });
      v_b6e533 = v_cb35cb.state;
      expect(v_cb35cb.cycle).toBeNull();
    }
    expect(v_b6e533.consecutiveFailures).toBe(0);
    expect(v_b6e533.backoffUntilMs).toBe(0);
  });

  test('일반 실패는 기존대로 센다', async () => {
    const v_cb35cb = await v_f644ce(v_48b3dc, v_46ff7a, 'tok', 1, 1000, {
      matchFaceFn: jest.fn().mockRejectedValue(new Error('net')),
    });
    expect(v_cb35cb.state.consecutiveFailures).toBe(1);
  });
});

describe('faceGallery - AFL-1041', () => {
  test('갤러리 403 FACE_CONSENT_REQUIRED 는 서버 /match 폴백 없이 던진다', async () => {
    const v_c33c0e = jest.fn();
    const v_35f85c = v_0a1524({
      fetchGallery: jest.fn().mockRejectedValue(v_e00746),
      serverMatch: v_c33c0e,
    } as never);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(v_35f85c.match('t', v_46ff7a, 1)).rejects.toBe(v_e00746);
    expect(v_c33c0e).not.toHaveBeenCalled();
  });

  test('일반 갤러리 실패는 서버 대조로 폴백(불변)', async () => {
    const v_c33c0e = jest.fn().mockResolvedValue({ matches: [], best: null, threshold: 0.6 });
    const v_35f85c = v_0a1524({
      fetchGallery: jest.fn().mockRejectedValue(new Error('net')),
      serverMatch: v_c33c0e,
    } as never);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await v_35f85c.match('t', v_46ff7a, 1);
    expect(v_c33c0e).toHaveBeenCalledTimes(1);
  });
});
