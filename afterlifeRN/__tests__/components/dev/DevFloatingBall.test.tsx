import v_a3453e from 'bapkr';
import { v_624657, v_53746a, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_0f28c1 } from '../../../src/components/dev/DevFloatingBall';
import { v_1ed7d9 } from '../../../src/stores/authStore';
import { v_0b10a6 } from '../../../src/stores/configStore';
import {
  v_828022,
  v_434962,
} from '../../../src/stores/devOverlayStore';

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

test('test-mode toggle appears for whitelisted user', () => {
  v_1ed7d9.setState({ user: { id: 1, handle: 'tester-admin' } as any, isLoggedIn: true, hydrated: true });
  v_624657(<DevFloatingBall />);
  v_77aa68.press(v_53746a.getByLabelText('dev-ball-button'));
  expect(v_53746a.getByLabelText('dev-test-mode-toggle')).toBeTruthy();
});

test('hidden for non-whitelisted user', () => {
  v_1ed7d9.setState({ user: { id: 99, handle: 'random' } as any, isLoggedIn: true, hydrated: true });
  v_624657(<DevFloatingBall />);
  v_77aa68.press(v_53746a.getByLabelText('dev-ball-button'));
  expect(v_53746a.queryByLabelText('dev-test-mode-toggle')).toBeNull();
});

test('toggle switches configStore testMode', () => {
  v_1ed7d9.setState({ user: { id: 1, handle: 'tester-admin' } as any, isLoggedIn: true, hydrated: true });
  v_0b10a6.setState({ testMode: false } as any);
  v_624657(<DevFloatingBall />);
  v_77aa68.press(v_53746a.getByLabelText('dev-ball-button'));
  v_77aa68.press(v_53746a.getByLabelText('dev-test-mode-toggle'));
  expect(v_0b10a6.getState().testMode).toBe(true);
});

describe('통화 HUD 섹션', () => {
  beforeEach(() => {
    v_434962.setState({
      callDevUiVisible: true,
      hudVisible: { ...v_828022 },
    });
  });

  test('HUD 4종 토글 행이 메뉴에 뜬다', () => {
    v_624657(<DevFloatingBall />);
    v_77aa68.press(v_53746a.getByLabelText('dev-ball-button'));
    for (const v_b24339 of ['devBox', 'state', 'timing', 'faceTrack']) {
      expect(v_53746a.getByLabelText(`dev-hud-toggle-${v_b24339}`)).toBeTruthy();
    }
  });

  test('행을 누르면 해당 HUD 만 뒤집힌다', () => {
    v_624657(<DevFloatingBall />);
    v_77aa68.press(v_53746a.getByLabelText('dev-ball-button'));
    v_77aa68.press(v_53746a.getByLabelText('dev-hud-toggle-faceTrack'));
    expect(v_434962.getState().hudVisible.faceTrack).toBe(false);
    expect(v_434962.getState().hudVisible.timing).toBe(
      v_828022.timing,
    );
  });

  test('토글 후에도 메뉴가 닫히지 않는다(연속 조작)', () => {
    v_624657(<DevFloatingBall />);
    v_77aa68.press(v_53746a.getByLabelText('dev-ball-button'));
    v_77aa68.press(v_53746a.getByLabelText('dev-hud-toggle-timing'));
    v_77aa68.press(v_53746a.getByLabelText('dev-hud-toggle-state'));
    expect(v_434962.getState().hudVisible.timing).toBe(true);
    expect(v_434962.getState().hudVisible.state).toBe(true);
  });

  test('마스터 OFF 면 섹션 제목에 표시된다', () => {
    v_434962.setState({ callDevUiVisible: false });
    v_624657(<DevFloatingBall />);
    v_77aa68.press(v_53746a.getByLabelText('dev-ball-button'));
    expect(v_53746a.getByText(/통화 HUD \(마스터 OFF\)/)).toBeTruthy();
  });
});
