import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_f48a74 } from '../../src/screens/clones/components/L1Section';
import type { v_eceede } from '../../src/types/domain';

function v_e8cd6d({ onChange: v_b187d9 }: { onChange: (v: v_eceede) => void }) {
  const [v_81e2ef, v_7a3ec2] = v_5ab095<v_eceede>({ attrs: { tone: 'warm' }, notes: '' });
  return (
    <L1Section
      value={v_81e2ef}
      editable
      onChange={(v_a448ad) => {
        v_7a3ec2(v_a448ad);
        v_b187d9(v_a448ad);
      }}
    />
  );
}

test('editable mode emits onChange on attr + notes edit', () => {
  const v_b187d9 = jest.fn();
  const { getByLabelText: v_690a9b } = v_624657(<Harness onChange={v_b187d9} />);
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
