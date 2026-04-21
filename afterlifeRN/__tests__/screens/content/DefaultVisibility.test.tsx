import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DefaultVisibility from '../../../src/screens/clone-creation/content/DefaultVisibility';
import type { CloneCreationDraft } from '../../../src/types/clone';

const base: CloneCreationDraft = { interests: [], coownerInvites: [] };

test('validate always passes (visibility is always set via default)', () => {
  expect(DefaultVisibility.validate(base)).toBe(true);
});
test('selecting followers fires onChange', () => {
  const onChange = jest.fn();
  const { getByText } = render(<DefaultVisibility draft={base} onChange={onChange} />);
  fireEvent.press(getByText('팔로워 공개'));
  expect(onChange).toHaveBeenCalledWith({ visibility: 'followers' });
});
