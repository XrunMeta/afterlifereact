import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Step3ImageUploadScreen from '../../src/screens/clone-creation/Step3ImageUploadScreen';
import { useCloneStore } from '../../src/stores/cloneStore';

const mockNavigate = jest.fn();
const nav: any = { navigation: { navigate: mockNavigate, goBack: jest.fn() } };

beforeEach(() => {
  useCloneStore.getState().resetCreationDraft();
  mockNavigate.mockClear();
});

test('shows entry banner by default and hides after dismiss', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByLabelText, queryByText } = render(<Step3ImageUploadScreen {...nav} />);
  expect(queryByText(/타입·관계는 수정할 수 없어요/)).toBeTruthy();
  fireEvent.press(getByLabelText('배너 닫기'));
  expect(queryByText(/타입·관계는 수정할 수 없어요/)).toBeNull();
});

test('renders MemlowImageUpload (skip hint) when cloneType=memlow', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'memlow' });
  const { getByText } = render(<Step3ImageUploadScreen {...nav} />);
  expect(getByText(/사진을 선택하거나 건너뛸 수 있어요/)).toBeTruthy();
});

test('renders DefaultImageUpload (guide section) when cloneType=friend', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByText } = render(<Step3ImageUploadScreen {...nav} />);
  expect(getByText('가이드')).toBeTruthy();
});

test('memlow with no image → next enabled (skip allowed)', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'memlow' });
  const { getByText } = render(<Step3ImageUploadScreen {...nav} />);
  fireEvent.press(getByText('다음 단계로 이동'));
  expect(mockNavigate).toHaveBeenCalledWith('Step4');
});

test('default with no image → next disabled', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByText } = render(<Step3ImageUploadScreen {...nav} />);
  fireEvent.press(getByText('다음 단계로 이동'));
  expect(mockNavigate).not.toHaveBeenCalled();
});
