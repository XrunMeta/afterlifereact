import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EditorTransferModal } from '../../src/screens/clones/components/EditorTransferModal';

const coowners = [
  { userId: 2, displayName: 'Bob' },
  { userId: 3, displayName: 'Carol' },
];

test('submits selection', () => {
  const onSubmit = jest.fn();
  const { getByLabelText } = render(
    <EditorTransferModal visible coowners={coowners} onClose={() => {}} onSubmit={onSubmit} />,
  );
  fireEvent.press(getByLabelText('transfer-target-2'));
  fireEvent.press(getByLabelText('transfer-submit'));
  expect(onSubmit).toHaveBeenCalledWith(2);
});
