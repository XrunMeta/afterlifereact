import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_922cea from '../../../src/screens/clone-creation/content/MemlowImageUpload';
import type { v_c2a674 } from '../../../src/types/clone';

const base: v_c2a674 = { interests: [], coownerInvites: [] };

test('validate: no image → pass (skip allowed)', () => {
  expect(v_922cea.validate(v_694b25)).toBe(true);
});

test('validate: image + rightsAcknowledged=false → fail', () => {
  expect(
    v_922cea.validate({
      ...v_694b25,
      imageFile: 'file://x.jpg',
      rightsAcknowledged: false,
    }),
  ).toBe(false);
});

test('validate: image + rightsAcknowledged=true → pass', () => {
  expect(
    v_922cea.validate({
      ...v_694b25,
      imageFile: 'file://x.jpg',
      rightsAcknowledged: true,
    }),
  ).toBe(true);
});

test('renders rights checkbox and toggles it', () => {
  const v_b187d9 = jest.fn();
  const { getByText: v_2b0f8a } = v_624657(
    <MemlowImageUpload draft={{ ...v_694b25, imageFile: 'file://x.jpg' }} onChange={v_b187d9} />,
  );
  v_77aa68.press(v_2b0f8a(/권리를 확인했어요/));
  expect(v_b187d9).toHaveBeenCalledWith({ rightsAcknowledged: true });
});
