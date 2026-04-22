import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CloneDetailScreen from '../../src/screens/clones/CloneDetailScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { SEED } from '../../src/mocks/seedIndex';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children,
}));

beforeEach(async () => {
  await useAuthStore.getState().hydrate();
});

function makeProps(cloneId: string): any {
  return {
    route: { params: { cloneId } },
    navigation: { goBack: jest.fn(), navigate: jest.fn() },
  };
}

test('renders coowner section for memlow clone with approved coowners', () => {
  const memlowWithCoowner = SEED.clones.find(
    (c) =>
      c.cloneType === 'memlow' &&
      SEED.coowners.some(
        (co) => co.cloneId === c.id && co.status === 'approved',
      ),
  );
  expect(memlowWithCoowner).toBeTruthy();
  render(<CloneDetailScreen {...makeProps(memlowWithCoowner!.id)} />);
  expect(screen.getByTestId('coowner-section')).toBeTruthy();
  expect(screen.getByText(/공동관리자.*명/)).toBeTruthy();
});

test('does not render coowner section for non-memlow clones', () => {
  const friendClone = SEED.clones.find((c) => c.cloneType === 'friend');
  expect(friendClone).toBeTruthy();
  render(<CloneDetailScreen {...makeProps(friendClone!.id)} />);
  expect(screen.queryByTestId('coowner-section')).toBeNull();
});
