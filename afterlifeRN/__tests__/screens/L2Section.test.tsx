import React from 'react';
import { render } from '@testing-library/react-native';
import { L2Section } from '../../src/screens/clones/components/L2Section';

test('renders memory count + last updated', () => {
  const { getByText, getByLabelText } = render(
    <L2Section memoryCount={1} lastUpdatedAt="2026-04-22T10:00:00Z" />,
  );
  expect(getByText(/1개의 기억/)).toBeTruthy();
  expect(getByLabelText('l2-last-updated')).toBeTruthy();
});

test('no last-updated when null', () => {
  const { getByText, queryByLabelText } = render(
    <L2Section memoryCount={0} lastUpdatedAt={null} />,
  );
  expect(getByText(/0개의 기억/)).toBeTruthy();
  expect(queryByLabelText('l2-last-updated')).toBeNull();
});
