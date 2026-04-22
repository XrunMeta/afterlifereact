import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MemlowVoiceUpload from '../../../src/screens/clone-creation/content/MemlowVoiceUpload';
import type { CloneCreationDraft } from '../../../src/types/clone';

const base: CloneCreationDraft = { interests: [], coownerInvites: [] };

test('validate: no voice → fail', () => {
  expect(MemlowVoiceUpload.validate(base)).toBe(false);
});
test('validate: recordDuration=29 alone → fail', () => {
  expect(MemlowVoiceUpload.validate({ ...base, recordDuration: 29 })).toBe(false);
});
test('validate: recordDuration=30 → pass', () => {
  expect(MemlowVoiceUpload.validate({ ...base, recordDuration: 30 })).toBe(true);
});
test('validate: voiceFile alone → pass', () => {
  expect(MemlowVoiceUpload.validate({ ...base, voiceFile: 'file://x.m4a' })).toBe(true);
});
test('renders 3 letter script cards', () => {
  const { getByText } = render(<MemlowVoiceUpload draft={base} onChange={jest.fn()} />);
  expect(getByText(/편지 1/)).toBeTruthy();
  expect(getByText(/편지 2/)).toBeTruthy();
  expect(getByText(/편지 3/)).toBeTruthy();
});
test('picking a script fires onChange with voiceScriptId', () => {
  const onChange = jest.fn();
  const { getByText } = render(<MemlowVoiceUpload draft={base} onChange={onChange} />);
  fireEvent.press(getByText(/편지 1/));
  expect(onChange).toHaveBeenCalledWith({ voiceScriptId: 's1' });
});
