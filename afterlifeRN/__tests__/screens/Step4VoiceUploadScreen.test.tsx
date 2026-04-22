import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Step4VoiceUploadScreen from '../../src/screens/clone-creation/Step4VoiceUploadScreen';
import { useCloneStore } from '../../src/stores/cloneStore';

const mockNavigate = jest.fn();
const nav: any = { navigation: { navigate: mockNavigate, goBack: jest.fn() } };

beforeEach(() => {
  useCloneStore.getState().resetCreationDraft();
  mockNavigate.mockClear();
});

test('renders DefaultVoiceUpload (sample cards) when cloneType=friend', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByText } = render(<Step4VoiceUploadScreen {...nav} />);
  expect(getByText('Nova')).toBeTruthy();
});

test('renders MemlowVoiceUpload (letter scripts) when cloneType=memlow', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'memlow' });
  const { getByText } = render(<Step4VoiceUploadScreen {...nav} />);
  expect(getByText(/편지 1/)).toBeTruthy();
});

test('default with no voice → next disabled', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByText } = render(<Step4VoiceUploadScreen {...nav} />);
  fireEvent.press(getByText('다음 단계로 이동'));
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('default with voiceSampleId → next enabled', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'friend', voiceSampleId: 'v1' });
  const { getByText } = render(<Step4VoiceUploadScreen {...nav} />);
  fireEvent.press(getByText('다음 단계로 이동'));
  expect(mockNavigate).toHaveBeenCalledWith('Step5');
});

test('memlow with voiceFile → next enabled', () => {
  useCloneStore.getState().setCreationDraft({
    cloneType: 'memlow',
    voiceFile: 'file://x.m4a',
  });
  const { getByText } = render(<Step4VoiceUploadScreen {...nav} />);
  fireEvent.press(getByText('다음 단계로 이동'));
  expect(mockNavigate).toHaveBeenCalledWith('Step5');
});
