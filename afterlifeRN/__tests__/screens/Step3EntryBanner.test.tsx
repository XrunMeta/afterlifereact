import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_d52542 from '../../src/components/common/Step3EntryBanner';

test('renders the immutability message', () => {
  const { getByText: v_2b0f8a } = v_624657(<Step3EntryBanner onDismiss={jest.fn()} />);
  expect(v_2b0f8a(/타입·관계는 수정할 수 없어요/)).toBeTruthy();
});

test('pressing close calls onDismiss', () => {
  const v_1b97a8 = jest.fn();
  const { getByLabelText: v_690a9b } = v_624657(<Step3EntryBanner onDismiss={v_1b97a8} />);
  v_77aa68.press(v_690a9b('배너 닫기'));
  expect(v_1b97a8).toHaveBeenCalledTimes(1);
});
