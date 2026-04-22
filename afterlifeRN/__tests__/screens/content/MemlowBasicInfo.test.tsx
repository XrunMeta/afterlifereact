import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_770fd5 from '../../../src/screens/clone-creation/content/MemlowBasicInfo';
import type { v_c2a674 } from '../../../src/types/clone';

const base: v_c2a674 = { interests: [], coownerInvites: [] };

test('validate requires name+username+relation', () => {
  expect(v_770fd5.validate(v_694b25)).toBe(false);
  expect(v_770fd5.validate({ ...v_694b25, name: 'A', username: '@a' })).toBe(false);
  expect(
    v_770fd5.validate({
      ...v_694b25,
      name: 'A',
      username: '@a',
      relation: 'mother',
    }),
  ).toBe(true);
});

test('selecting a relation fires onChange with relation id', () => {
  const v_b187d9 = jest.fn();
  const { getByText: v_2b0f8a } = v_624657(<MemlowBasicInfo draft={v_694b25} onChange={v_b187d9} />);
  v_77aa68.press(v_2b0f8a('어머니'));
  expect(v_b187d9).toHaveBeenCalledWith({ relation: 'mother' });
});

test('renders all 8 relations', () => {
  const { getByText: v_2b0f8a } = v_624657(<MemlowBasicInfo draft={v_694b25} onChange={jest.fn()} />);
  for (const v_2869c1 of ['어머니', '아버지', '배우자', '자녀', '형제자매', '친구', '반려동물', '기타']) {
    expect(v_2b0f8a(v_2869c1)).toBeTruthy();
  }
});
