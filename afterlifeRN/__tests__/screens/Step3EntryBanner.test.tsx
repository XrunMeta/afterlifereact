import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Step3EntryBanner from '../../src/components/common/Step3EntryBanner';

test('renders the immutability message', () => {
  const { getByText } = render(<Step3EntryBanner onDismiss={jest.fn()} />);
  expect(getByText(/타입·관계는 수정할 수 없어요/)).toBeTruthy();
});

test('pressing close calls onDismiss', () => {
  const onDismiss = jest.fn();
  const { getByLabelText } = render(<Step3EntryBanner onDismiss={onDismiss} />);
  fireEvent.press(getByLabelText('배너 닫기'));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
