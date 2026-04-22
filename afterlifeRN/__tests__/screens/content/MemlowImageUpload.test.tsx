import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MemlowImageUpload from '../../../src/screens/clone-creation/content/MemlowImageUpload';
import type { CloneCreationDraft } from '../../../src/types/clone';

const base: CloneCreationDraft = { interests: [], coownerInvites: [] };

test('validate: no image → pass (skip allowed)', () => {
  expect(MemlowImageUpload.validate(base)).toBe(true);
});

test('validate: image + rightsAcknowledged=false → fail', () => {
  expect(
    MemlowImageUpload.validate({
      ...base,
      imageFile: 'file://x.jpg',
      rightsAcknowledged: false,
    }),
  ).toBe(false);
});

test('validate: image + rightsAcknowledged=true → pass', () => {
  expect(
    MemlowImageUpload.validate({
      ...base,
      imageFile: 'file://x.jpg',
      rightsAcknowledged: true,
    }),
  ).toBe(true);
});

test('renders rights checkbox and toggles it', () => {
  const onChange = jest.fn();
  const { getByText } = render(
    <MemlowImageUpload draft={{ ...base, imageFile: 'file://x.jpg' }} onChange={onChange} />,
  );
  fireEvent.press(getByText(/권리를 확인했어요/));
  expect(onChange).toHaveBeenCalledWith({ rightsAcknowledged: true });
});
