import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_9b783f } from '../../src/screens/clones/components/EditorTransferModal';

const v_62c8fb = [
  { userId: 2, displayName: 'Bob' },
  { userId: 3, displayName: 'Carol' },
];

test('submits selection', () => {
  const v_3bfe4c = jest.fn();
  const { getByLabelText: v_690a9b } = v_624657(
    <EditorTransferModal visible coowners={v_62c8fb} onClose={() => {}} onSubmit={v_3bfe4c} />,
  );
  v_77aa68.press(v_690a9b('transfer-target-2'));
  v_77aa68.press(v_690a9b('transfer-submit'));
  expect(v_3bfe4c).toHaveBeenCalledWith(2);
});
