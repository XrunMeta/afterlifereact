import React from 'react';
import { render } from '@testing-library/react-native';
import Step7CompleteScreen from '../../src/screens/clone-creation/Step7CompleteScreen';
import { useCloneStore } from '../../src/stores/cloneStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const nav: any = {
  navigation: { getParent: () => ({ dispatch: jest.fn() }) },
};

beforeEach(() => {
  useCloneStore.getState().resetCreationDraft();
  useCloneStore.setState({ localClones: [] });
});

test('memlow copy shows 추모 톤', () => {
  useCloneStore.getState().setCreationDraft({
    cloneType: 'memlow', name: '엄마', username: '@mom',
    relation: 'mother', imageFile: 'f', voiceFile: 'v',
  });
  const { getByText } = render(<Step7CompleteScreen {...nav} />);
  expect(getByText(/추억을 이어가요/)).toBeTruthy();
});

test('friend copy shows 발랄 톤', () => {
  useCloneStore.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: 'f', voiceSampleId: 'v1',
  });
  const { getByText } = render(<Step7CompleteScreen {...nav} />);
  expect(getByText(/친구가 준비됐어요/)).toBeTruthy();
});

test('on mount adds new clone to localClones with derived status', () => {
  useCloneStore.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: undefined, voiceSampleId: undefined,
  });
  render(<Step7CompleteScreen {...nav} />);
  const c = useCloneStore.getState().localClones[0];
  expect(c.status).toBe('pending_assets');
});

test('clone with image+voice gets status=active', () => {
  useCloneStore.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: 'f', voiceSampleId: 'v1',
  });
  render(<Step7CompleteScreen {...nav} />);
  expect(useCloneStore.getState().localClones[0].status).toBe('active');
});
