import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_f48a74 } from '../../src/screens/clones/components/L1Section';

test('editable mode emits onChange on attr + notes edit', () => {
  const v_b187d9 = jest.fn();
  const { getByLabelText: v_690a9b } = v_624657(
    <L1Section
      value={{ attrs: { tone: 'warm' }, notes: '' }}
      editable
      onChange={v_b187d9}
    />,
  );
  v_77aa68.changeText(v_690a9b('l1-attr-tone'), 'sharp');
  expect(v_b187d9).toHaveBeenLastCalledWith({ attrs: { tone: 'sharp' }, notes: '' });
  v_77aa68.changeText(v_690a9b('l1-notes'), 'loves jazz');
  expect(v_b187d9).toHaveBeenLastCalledWith({ attrs: { tone: 'sharp' }, notes: 'loves jazz' });
});

test('readonly mode disables inputs', () => {
  const { getByLabelText: v_690a9b } = v_624657(
    <L1Section value={{ attrs: { tone: 'warm' }, notes: '' }} editable={false} onChange={() => {}} />,
  );
  expect(v_690a9b('l1-attr-tone').props.editable).toBe(false);
});
