import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Step2BasicInfoScreen from '../../src/screens/clone-creation/Step2BasicInfoScreen';
import { useCloneStore } from '../../src/stores/cloneStore';

const mockNavigate = jest.fn();
const nav: any = { navigation: { navigate: mockNavigate, goBack: jest.fn() } };

beforeEach(() => {
  useCloneStore.getState().resetCreationDraft();
  mockNavigate.mockClear();
});

test('renders MemlowBasicInfo when cloneType=memlow', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'memlow' });
  const { getByText } = render(<Step2BasicInfoScreen {...nav} />);
  expect(getByText('고인과의 관계')).toBeTruthy();
});

test('renders DefaultBasicInfo when cloneType=friend', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'friend' });
  const { queryByText, getByText } = render(<Step2BasicInfoScreen {...nav} />);
  expect(queryByText('고인과의 관계')).toBeNull();
  expect(getByText('카테고리')).toBeTruthy();
});

test('next button disabled until content validates', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByText } = render(<Step2BasicInfoScreen {...nav} />);
  fireEvent.press(getByText('다음 단계로 이동'));
  expect(mockNavigate).not.toHaveBeenCalled();
});
