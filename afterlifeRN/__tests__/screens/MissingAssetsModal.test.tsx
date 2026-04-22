import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_f81454 from '../../src/components/common/MissingAssetsModal';

test('renders body text about pending_assets', () => {
  const { getByText: v_2b0f8a } = v_624657(
    <MissingAssetsModal visible onAddNow={jest.fn()} onLater={jest.fn()} />,
  );
  expect(v_2b0f8a(/잠깐, 추가 정보가 필요해요/)).toBeTruthy();
  expect(v_2b0f8a(/생성대기중/)).toBeTruthy();
});

test('pressing 지금 추가하러 fires onAddNow', () => {
  const v_4a7b62 = jest.fn();
  const { getByText: v_2b0f8a } = v_624657(
    <MissingAssetsModal visible onAddNow={v_4a7b62} onLater={jest.fn()} />,
  );
  v_77aa68.press(v_2b0f8a('지금 추가하러'));
  expect(v_4a7b62).toHaveBeenCalled();
});

test('pressing 나중에 추가 fires onLater', () => {
  const v_c77d15 = jest.fn();
  const { getByText: v_2b0f8a } = v_624657(
    <MissingAssetsModal visible onAddNow={jest.fn()} onLater={v_c77d15} />,
  );
  v_77aa68.press(v_2b0f8a('나중에 추가'));
  expect(v_c77d15).toHaveBeenCalled();
});
