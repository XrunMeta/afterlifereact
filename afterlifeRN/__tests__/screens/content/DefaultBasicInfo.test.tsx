import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DefaultBasicInfo from '../../../src/screens/clone-creation/content/DefaultBasicInfo';
import type { CloneCreationDraft } from '../../../src/types/clone';

const baseDraft: CloneCreationDraft = { interests: [], coownerInvites: [] };

test('validate returns false when name/username/interests missing', () => {
  expect(DefaultBasicInfo.validate(baseDraft)).toBe(false);
});

test('validate requires ≥1 interest and non-empty name/username', () => {
  const d: CloneCreationDraft = { ...baseDraft, name: 'A', username: '@a', interests: ['x'] };
  expect(DefaultBasicInfo.validate(d)).toBe(true);
});

test('typing into name fires onChange with merged name', () => {
  const onChange = jest.fn();
  const { getByPlaceholderText } = render(
    <DefaultBasicInfo draft={baseDraft} onChange={onChange} />,
  );
  fireEvent.changeText(getByPlaceholderText('클론 이름'), '루나');
  expect(onChange).toHaveBeenCalledWith({ name: '루나' });
});

test('does NOT show memlow-only relation section', () => {
  const { queryByText } = render(<DefaultBasicInfo draft={baseDraft} onChange={jest.fn()} />);
  expect(queryByText('고인과의 관계')).toBeNull();
});
