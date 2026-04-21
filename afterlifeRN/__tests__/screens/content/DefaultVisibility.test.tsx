import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_bba87e from '../../../src/screens/clone-creation/content/DefaultVisibility';
import type { v_c2a674 } from '../../../src/types/clone';

const base: v_c2a674 = { interests: [], coownerInvites: [] };

test('validate always passes (visibility is always set via default)', () => {
  expect(v_bba87e.validate(v_694b25)).toBe(true);
});
test('selecting followers fires onChange', () => {
  const v_b187d9 = jest.fn();
  const { getByText: v_2b0f8a } = v_624657(<DefaultVisibility draft={v_694b25} onChange={v_b187d9} />);
  v_77aa68.press(v_2b0f8a('팔로워 공개'));
  expect(v_b187d9).toHaveBeenCalledWith({ visibility: 'followers' });
});
