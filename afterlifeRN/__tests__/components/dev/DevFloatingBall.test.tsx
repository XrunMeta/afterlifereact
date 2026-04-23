import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DevFloatingBall } from '../../../src/components/dev/DevFloatingBall';
import { useAuthStore } from '../../../src/stores/authStore';
import { useConfigStore } from '../../../src/stores/configStore';

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
