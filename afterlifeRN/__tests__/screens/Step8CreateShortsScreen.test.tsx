import v_a3453e from 'bapkr';
import { v_624657, v_be73a0, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_d19b01 from '../../src/screens/clone-creation/Step8CreateShortsScreen';
import { v_1ed7d9 } from '../../src/stores/authStore';
import { v_5fbf8f } from '../../src/api/shortsStore';
import { v_9a8286 } from '../../src/api/client';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

const v_6be210 = jest.fn();
function v_b12529() {
  return {
    navigate: jest.fn(),
    replace: jest.fn(),
    getParent: () => ({ dispatch: v_6be210 }),
  } as any;
}

beforeEach(() => {
  v_1ed7d9.setState({
    user: { id: 1 } as any,
    isLoggedIn: true,
    hydrated: true,
  });
  v_5fbf8f();
  v_6be210.mockReset();
});

test('owner: queued → ready 전이 후 preview 렌더', async () => {
  const v_c65f5d = v_b12529();
  const { queryByLabelText: v_32bb43, findByLabelText: v_ef8e36 } = v_624657(
    <Step8CreateShortsScreen
      route={{ params: { cloneId: 1 } } as any}
      navigation={v_c65f5d}
    />,
  );

  await v_be73a0(async () => {
    await Promise.resolve();
  });
  expect(v_32bb43('step8-progress')).toBeTruthy();

  const v_8a1142 = jest
    .spyOn(v_9a8286, 'getShort')
    .mockResolvedValue({ shortId: 4, status: 'ready', mediaUrl: 'https://cdn/x.mp4' });

  await v_be73a0(async () => {
    jest.useFakeTimers();
    jest.advanceTimersByTime(300);
    jest.useRealTimers();
    await Promise.resolve();
  });

  expect(await v_ef8e36('step8-preview')).toBeTruthy();
  v_8a1142.mockRestore();
});

test('step8-skip: HomeTab 으로 탭 이동', async () => {
  const v_c65f5d = v_b12529();
  const { findByLabelText: v_ef8e36 } = v_624657(
    <Step8CreateShortsScreen
      route={{ params: { cloneId: 1 } } as any}
      navigation={v_c65f5d}
    />,
  );
  await v_be73a0(async () => {
    await Promise.resolve();
  });
  v_77aa68.press(await v_ef8e36('step8-skip'));
  expect(v_6be210).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'NAVIGATE',
      payload: expect.objectContaining({ name: 'HomeTab' }),
    }),
  );
});

test('non-owner: generateShort 거부 → 권한 없음 메시지', async () => {
  v_1ed7d9.setState({
    user: { id: 99999 } as any,
    isLoggedIn: true,
    hydrated: true,
  });
  const v_c65f5d = v_b12529();
  const { findByLabelText: v_ef8e36 } = v_624657(
    <Step8CreateShortsScreen
      route={{ params: { cloneId: 1 } } as any}
      navigation={v_c65f5d}
    />,
  );
  await v_be73a0(async () => {
    await Promise.resolve();
  });
  expect(await v_ef8e36('step8-forbidden')).toBeTruthy();
});
