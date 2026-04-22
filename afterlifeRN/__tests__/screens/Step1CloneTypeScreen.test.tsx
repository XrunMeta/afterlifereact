import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Step1CloneTypeScreen from '../../src/screens/clone-creation/Step1CloneTypeScreen';
import { useCloneStore } from '../../src/stores/cloneStore';

const mockNavigate = jest.fn();
const navProps = { navigation: { navigate: mockNavigate, getParent: () => ({ navigate: jest.fn() }) } } as any;

beforeEach(() => {
  useCloneStore.getState().resetCreationDraft();
  mockNavigate.mockClear();
});

test('renders 4 cloneType cards with labels', () => {
  const { getByText } = render(<Step1CloneTypeScreen {...navProps} />);
  expect(getByText('떠난 소중한 이')).toBeTruthy();
  expect(getByText('창작 AI 친구')).toBeTruthy();
  expect(getByText('전문 멘토')).toBeTruthy();
  expect(getByText('유명인')).toBeTruthy();
});

test('next button disabled until a type is selected', () => {
  const { getByText } = render(<Step1CloneTypeScreen {...navProps} />);
  fireEvent.press(getByText('다음'));
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('selecting memlow and pressing next saves cloneType and navigates to Step2', () => {
  const { getByText } = render(<Step1CloneTypeScreen {...navProps} />);
  fireEvent.press(getByText('떠난 소중한 이'));
  fireEvent.press(getByText('다음'));
  expect(useCloneStore.getState().creationDraft.cloneType).toBe('memlow');
  expect(mockNavigate).toHaveBeenCalledWith('Step2');
});

test('Step1 does not render category/interests UI', () => {
  const { queryByText } = render(<Step1CloneTypeScreen {...navProps} />);
  expect(queryByText('카테고리 선택')).toBeNull();
  expect(queryByText('관심사 선택')).toBeNull();
});
