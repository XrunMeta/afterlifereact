import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DevFloatingBall } from '../../../src/components/dev/DevFloatingBall';
import { useAuthStore } from '../../../src/stores/authStore';
import { useConfigStore } from '../../../src/stores/configStore';
import {
  CALL_HUD_DEFAULTS,
  useDevOverlayStore,
} from '../../../src/stores/devOverlayStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

test('renders the dev ball button', () => {
  render(<DevFloatingBall />);
  expect(screen.getByLabelText('dev-ball-button')).toBeTruthy();
});

test('opens the menu on press', () => {
  render(<DevFloatingBall />);
  fireEvent.press(screen.getByLabelText('dev-ball-button'));
  expect(screen.getByText('유저 스위치')).toBeTruthy();
  expect(screen.getByText('Seed 리셋')).toBeTruthy();
});

test('renders nothing when __DEV__ is false', () => {
  const original = (global as any).__DEV__;
  (global as any).__DEV__ = false;
  const { toJSON } = render(<DevFloatingBall />);
  expect(toJSON()).toBeNull();
  (global as any).__DEV__ = original;
});

test('API Probe action opens the probe modal', () => {
  render(<DevFloatingBall />);
  fireEvent.press(screen.getByLabelText('dev-ball-button'));
  fireEvent.press(screen.getByLabelText('dev-api-probe'));

  expect(screen.getByText(/API Probe · \(unknown\)/)).toBeTruthy();
  expect(screen.getByText('이 화면에 매핑된 API 없음')).toBeTruthy();
});

test('test-mode toggle appears for whitelisted user', () => {
  useAuthStore.setState({ user: { id: 1, handle: 'tester-admin' } as any, isLoggedIn: true, hydrated: true });
  render(<DevFloatingBall />);
  fireEvent.press(screen.getByLabelText('dev-ball-button'));
  expect(screen.getByLabelText('dev-test-mode-toggle')).toBeTruthy();
});

test('hidden for non-whitelisted user', () => {
  useAuthStore.setState({ user: { id: 99, handle: 'random' } as any, isLoggedIn: true, hydrated: true });
  render(<DevFloatingBall />);
  fireEvent.press(screen.getByLabelText('dev-ball-button'));
  expect(screen.queryByLabelText('dev-test-mode-toggle')).toBeNull();
});

test('toggle switches configStore testMode', () => {
  useAuthStore.setState({ user: { id: 1, handle: 'tester-admin' } as any, isLoggedIn: true, hydrated: true });
  useConfigStore.setState({ testMode: false } as any);
  render(<DevFloatingBall />);
  fireEvent.press(screen.getByLabelText('dev-ball-button'));
  fireEvent.press(screen.getByLabelText('dev-test-mode-toggle'));
  expect(useConfigStore.getState().testMode).toBe(true);
});

describe('통화 HUD 섹션', () => {
  beforeEach(() => {
    useDevOverlayStore.setState({
      callDevUiVisible: true,
      hudVisible: { ...CALL_HUD_DEFAULTS },
    });
  });

  test('HUD 4종 토글 행이 메뉴에 뜬다', () => {
    render(<DevFloatingBall />);
    fireEvent.press(screen.getByLabelText('dev-ball-button'));
    for (const key of ['devBox', 'state', 'timing', 'faceTrack']) {
      expect(screen.getByLabelText(`dev-hud-toggle-${key}`)).toBeTruthy();
    }
  });

  test('행을 누르면 해당 HUD 만 뒤집힌다', () => {
    render(<DevFloatingBall />);
    fireEvent.press(screen.getByLabelText('dev-ball-button'));
    fireEvent.press(screen.getByLabelText('dev-hud-toggle-faceTrack'));
    expect(useDevOverlayStore.getState().hudVisible.faceTrack).toBe(false);
    expect(useDevOverlayStore.getState().hudVisible.timing).toBe(
      CALL_HUD_DEFAULTS.timing,
    );
  });

  test('토글 후에도 메뉴가 닫히지 않는다(연속 조작)', () => {
    render(<DevFloatingBall />);
    fireEvent.press(screen.getByLabelText('dev-ball-button'));
    fireEvent.press(screen.getByLabelText('dev-hud-toggle-timing'));
    fireEvent.press(screen.getByLabelText('dev-hud-toggle-state'));
    expect(useDevOverlayStore.getState().hudVisible.timing).toBe(true);
    expect(useDevOverlayStore.getState().hudVisible.state).toBe(true);
  });

  test('마스터 OFF 면 섹션 제목에 표시된다', () => {
    useDevOverlayStore.setState({ callDevUiVisible: false });
    render(<DevFloatingBall />);
    fireEvent.press(screen.getByLabelText('dev-ball-button'));
    expect(screen.getByText(/통화 HUD \(마스터 OFF\)/)).toBeTruthy();
  });
});
