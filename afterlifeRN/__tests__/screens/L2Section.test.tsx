import v_a3453e from 'bapkr';
import { v_624657 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_193b22 } from '../../src/screens/clones/components/L2Section';

test('renders memory count + last updated', () => {
  const { getByText: v_2b0f8a, getByLabelText: v_690a9b } = v_624657(
    <L2Section memoryCount={1} lastUpdatedAt="2026-04-22T10:00:00Z" />,
  );
  expect(v_2b0f8a(/1개의 기억/)).toBeTruthy();
  expect(v_690a9b('l2-last-updated')).toBeTruthy();
});

test('no last-updated when null', () => {
  const { getByText: v_2b0f8a, queryByLabelText: v_32bb43 } = v_624657(
    <L2Section memoryCount={0} lastUpdatedAt={null} />,
  );
  expect(v_2b0f8a(/0개의 기억/)).toBeTruthy();
  expect(v_32bb43('l2-last-updated')).toBeNull();
});
