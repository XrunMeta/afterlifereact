import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_25b857 from '../../../src/screens/clone-creation/content/MemlowVisibility';
import type { v_c2a674 } from '../../../src/types/clone';

const base: v_c2a674 = { interests: [], coownerInvites: [] };

test('on mount forces visibility=private when not already set', () => {
  const v_b187d9 = jest.fn();
  v_624657(<MemlowVisibility draft={v_694b25} onChange={v_b187d9} />);
  expect(v_b187d9).toHaveBeenCalledWith({ visibility: 'private' });
});
test('validate: empty invites → pass', () => {
  expect(v_25b857.validate({ ...v_694b25, visibility: 'private' })).toBe(true);
});
test('validate: invalid email in invites → fail', () => {
  expect(v_25b857.validate({
    ...v_694b25, visibility: 'private', coownerInvites: ['nope'],
  })).toBe(false);
});
test('validate: valid emails → pass', () => {
  expect(v_25b857.validate({
    ...v_694b25, visibility: 'private', coownerInvites: ['a@b.com', 'c@d.io'],
  })).toBe(true);
});
test('displays private-lock message', () => {
  const { getByText: v_2b0f8a } = v_624657(
    <MemlowVisibility draft={{ ...v_694b25, visibility: 'private' }} onChange={jest.fn()} />,
  );
  expect(v_2b0f8a(/비공개로 고정/)).toBeTruthy();
});
