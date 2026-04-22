import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MissingAssetsModal from '../../src/components/common/MissingAssetsModal';

test('renders body text about pending_assets', () => {
  const { getByText } = render(
    <MissingAssetsModal visible onAddNow={jest.fn()} onLater={jest.fn()} />,
  );
  expect(getByText(/잠깐, 추가 정보가 필요해요/)).toBeTruthy();
  expect(getByText(/생성대기중/)).toBeTruthy();
});

test('pressing 지금 추가하러 fires onAddNow', () => {
  const onAddNow = jest.fn();
  const { getByText } = render(
    <MissingAssetsModal visible onAddNow={onAddNow} onLater={jest.fn()} />,
  );
  fireEvent.press(getByText('지금 추가하러'));
  expect(onAddNow).toHaveBeenCalled();
});

test('pressing 나중에 추가 fires onLater', () => {
  const onLater = jest.fn();
  const { getByText } = render(
    <MissingAssetsModal visible onAddNow={jest.fn()} onLater={onLater} />,
  );
  fireEvent.press(getByText('나중에 추가'));
  expect(onLater).toHaveBeenCalled();
});
