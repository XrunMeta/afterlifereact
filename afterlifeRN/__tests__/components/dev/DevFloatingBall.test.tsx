import v_a3453e from 'bapkr';
import { v_624657, v_53746a, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_0f28c1 } from '../../../src/components/dev/DevFloatingBall';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

test('renders the dev ball button', () => {
  v_624657(<DevFloatingBall />);
  expect(v_53746a.getByLabelText('dev-ball-button')).toBeTruthy();
});

test('opens the menu on press', () => {
  v_624657(<DevFloatingBall />);
  v_77aa68.press(v_53746a.getByLabelText('dev-ball-button'));
  expect(v_53746a.getByText('유저 스위치')).toBeTruthy();
  expect(v_53746a.getByText('Seed 리셋')).toBeTruthy();
});

test('renders nothing when __DEV__ is false', () => {
  const v_f7fd54 = (global as any).__DEV__;
  (global as any).__DEV__ = false;
  const { toJSON: v_21dbe2 } = v_624657(<DevFloatingBall />);
  expect(v_21dbe2()).toBeNull();
  (global as any).__DEV__ = v_f7fd54;
});

test('API Probe action opens the probe modal', () => {
  v_624657(<DevFloatingBall />);
  v_77aa68.press(v_53746a.getByLabelText('dev-ball-button'));
  v_77aa68.press(v_53746a.getByLabelText('dev-api-probe'));

  expect(v_53746a.getByText(/API Probe · \(unknown\)/)).toBeTruthy();
  expect(v_53746a.getByText('이 화면에 매핑된 API 없음')).toBeTruthy();
});
