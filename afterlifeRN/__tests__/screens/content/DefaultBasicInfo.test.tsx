import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_a9780f from '../../../src/screens/clone-creation/content/DefaultBasicInfo';
import type { v_c2a674 } from '../../../src/types/clone';

const baseDraft: v_c2a674 = { interests: [], coownerInvites: [] };

test('validate returns false when name/username/interests missing', () => {
  expect(v_a9780f.validate(v_788a71)).toBe(false);
});

test('validate requires ≥1 interest and non-empty name/username', () => {
  const d: v_c2a674 = { ...v_788a71, name: 'A', username: '@a', interests: ['x'] };
  expect(v_a9780f.validate(v_d5dda0)).toBe(true);
});

test('typing into name fires onChange with merged name', () => {
  const v_b187d9 = jest.fn();
  const { getByPlaceholderText: v_c42d22 } = v_624657(
    <DefaultBasicInfo draft={v_788a71} onChange={v_b187d9} />,
  );
  v_77aa68.changeText(v_c42d22('페르소나 이름'), '루나');
  expect(v_b187d9).toHaveBeenCalledWith({ name: '루나' });
});

test('does NOT show memlow-only relation section', () => {
  const { queryByText: v_480380 } = v_624657(<DefaultBasicInfo draft={v_788a71} onChange={jest.fn()} />);
  expect(v_480380('고인과의 관계')).toBeNull();
});
