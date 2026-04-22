import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DevFloatingBall } from '../../../src/components/dev/DevFloatingBall';

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
