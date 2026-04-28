import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MemlowBasicInfo from '../../../src/screens/clone-creation/content/MemlowBasicInfo';
import type { CloneCreationDraft } from '../../../src/types/clone';

const base: CloneCreationDraft = { interests: [], coownerInvites: [] };

test('validate requires name+username+relation', () => {
  expect(MemlowBasicInfo.validate(base)).toBe(false);
  expect(MemlowBasicInfo.validate({ ...base, name: 'A', username: '@a' })).toBe(false);
  expect(
    MemlowBasicInfo.validate({
      ...base,
      name: 'A',
      username: '@a',
      relation: 'mother',
    }),
  ).toBe(true);
});

test('selecting a relation fires onChange with relation id', () => {
  const onChange = jest.fn();
  const { getByText } = render(<MemlowBasicInfo draft={base} onChange={onChange} />);
  fireEvent.press(getByText('어머니'));
  expect(onChange).toHaveBeenCalledWith({ relation: 'mother' });
});

test('renders all 8 relations', () => {
  const { getByText, getAllByText } = render(<MemlowBasicInfo draft={base} onChange={jest.fn()} />);

  for (const label of ['어머니', '아버지', '배우자', '자녀', '형제자매', '친구', '반려동물']) {
    expect(getByText(label)).toBeTruthy();
  }
  expect(getAllByText('기타').length).toBeGreaterThanOrEqual(1);
});
