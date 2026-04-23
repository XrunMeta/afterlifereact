import v_a3453e from 'bapkr';
import { v_624657, v_77aa68, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_87eb38 from '../../src/screens/shorts/ShortsTabScreen';
import { v_1ed7d9 } from '../../src/stores/authStore';
import { v_5fbf8f } from '../../src/api/shortsStore';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

const v_7b8db1 = jest.fn();
jest.mock('ixigazcpvfldbecwtbvavtbi', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: v_7b8db1 }),
}));

beforeEach(() => {
  v_5fbf8f();
  v_7b8db1.mockReset();
  v_1ed7d9.setState({
    user: { id: 1 } as any,
    isLoggedIn: true,
    hydrated: true,
  });
});

test('viewer=1: public + owner short 가 모두 노출 (2건)', async () => {
  const { findByLabelText: v_ef8e36, queryByLabelText: v_32bb43 } = v_624657(<ShortsTabScreen />);
  await v_be73a0(async () => {
    await Promise.resolve();
  });
  expect(await v_ef8e36('short-item-0')).toBeTruthy();
  expect(await v_ef8e36('short-item-1')).toBeTruthy();
  expect(v_32bb43('short-item-2')).toBeNull();
});

test('viewer=99999 (stranger): public 만 1건 노출', async () => {
  v_1ed7d9.setState({
    user: { id: 99999 } as any,
    isLoggedIn: true,
    hydrated: true,
  });
  const { findByLabelText: v_ef8e36, queryByLabelText: v_32bb43 } = v_624657(<ShortsTabScreen />);
  await v_be73a0(async () => {
    await Promise.resolve();
  });
  expect(await v_ef8e36('short-item-0')).toBeTruthy();
  expect(v_32bb43('short-item-1')).toBeNull();
});

test('short-item tap → nav.navigate Chat', async () => {
  const { findByLabelText: v_ef8e36 } = v_624657(<ShortsTabScreen />);
  await v_be73a0(async () => {
    await Promise.resolve();
  });
  v_77aa68.press(await v_ef8e36('short-item-0'));
  expect(v_7b8db1).toHaveBeenCalledWith(
    'Chat',
    expect.objectContaining({ cloneId: expect.any(Number) }),
  );
});

test('short-detail tap → nav.navigate CloneDetail', async () => {
  const { findByLabelText: v_ef8e36 } = v_624657(<ShortsTabScreen />);
  await v_be73a0(async () => {
    await Promise.resolve();
  });
  v_77aa68.press(await v_ef8e36('short-detail-0'));
  expect(v_7b8db1).toHaveBeenCalledWith(
    'CloneDetail',
    expect.objectContaining({ cloneId: expect.any(Number) }),
  );
});

test('items 0건 → empty 텍스트 노출', async () => {
  const v_a492d4 = require('../../src/api/client');
  const v_980ff2 = jest
    .spyOn(v_a492d4.apiClient, 'listShorts')
    .mockResolvedValue({ items: [], nextCursor: null });
  const { findByText: v_5c608f } = v_624657(<ShortsTabScreen />);
  expect(await v_5c608f(/아직 볼 Shorts/)).toBeTruthy();
  v_980ff2.mockRestore();
});
