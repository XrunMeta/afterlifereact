import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MemlowVisibility from '../../../src/screens/clone-creation/content/MemlowVisibility';
import type { CloneCreationDraft } from '../../../src/types/clone';

const base: CloneCreationDraft = { interests: [], coownerInvites: [] };

test('on mount forces visibility=private when not already set', () => {
  const onChange = jest.fn();
  render(<MemlowVisibility draft={base} onChange={onChange} />);
  expect(onChange).toHaveBeenCalledWith({ visibility: 'private' });
});
test('validate: empty invites → pass', () => {
  expect(MemlowVisibility.validate({ ...base, visibility: 'private' })).toBe(true);
});
test('validate: invalid email in invites → fail', () => {
  expect(MemlowVisibility.validate({
    ...base, visibility: 'private', coownerInvites: ['nope'],
  })).toBe(false);
});
test('validate: valid emails → pass', () => {
  expect(MemlowVisibility.validate({
    ...base, visibility: 'private', coownerInvites: ['a@b.com', 'c@d.io'],
  })).toBe(true);
});
test('displays private-lock message', () => {
  const { getByText } = render(
    <MemlowVisibility draft={{ ...base, visibility: 'private' }} onChange={jest.fn()} />,
  );
  expect(getByText(/비공개로 고정/)).toBeTruthy();
});
