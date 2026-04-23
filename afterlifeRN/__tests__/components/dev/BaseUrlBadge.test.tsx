import React from 'react';
import { render } from '@testing-library/react-native';
import { BaseUrlBadge } from '../../../src/components/dev/BaseUrlBadge';
import { useConfigStore } from '../../../src/stores/configStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

test('renders nothing in prod', () => {
  useConfigStore.setState({ testMode: false, baseUrl: 'https://oth-path.prod' } as any);
  const { toJSON } = render(<BaseUrlBadge />);
  expect(toJSON()).toBeNull();
});

test('renders PREVIEW badge in test mode', () => {
  useConfigStore.setState({ testMode: true, baseUrl: 'https://oth-path.preview' } as any);
  const { getByText } = render(<BaseUrlBadge />);
  expect(getByText('PREVIEW')).toBeTruthy();
});
