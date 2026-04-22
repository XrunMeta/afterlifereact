import React from 'react';
import { render } from '@testing-library/react-native';
import ChatScreen from '../../src/screens/clone-interaction/ChatScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { SEED } from '../../src/mocks/seedIndex';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await useAuthStore.getState().hydrate();
});

function makeProps(cloneId: number): any {
  return {
    route: { params: { cloneId } },
    navigation: { goBack: jest.fn() },
  };
}

test('Chat renders only messages belonging to this clone + current user', () => {
  const cloneWithMessages = SEED.clones.find((c) =>
    SEED.messages.some((m) => m.cloneId === c.id && m.userId === 1),
  );
  expect(cloneWithMessages).toBeTruthy();

  const { queryByText } = render(
    <ChatScreen {...makeProps(cloneWithMessages!.id)} />,
  );

  const expected = SEED.messages.filter(
    (m) => m.cloneId === cloneWithMessages!.id && m.userId === 1,
  );

  expect(queryByText(expected[0].content)).toBeTruthy();

  const otherCloneMsg = SEED.messages.find(
    (m) => m.cloneId !== cloneWithMessages!.id && m.userId === 1,
  );
  if (otherCloneMsg) {
    expect(queryByText(otherCloneMsg.content)).toBeNull();
  }
});
