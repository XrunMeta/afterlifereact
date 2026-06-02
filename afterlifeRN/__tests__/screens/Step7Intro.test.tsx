

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const draft: Record<string, unknown> = {
  cloneType: 'friend',
  name: '할배',
  description: '정 많은 할아버지예요. #추모',
  imageFile: null,
};
const mockSetCreationDraft = jest.fn();
const mockResetCreationDraft = jest.fn();
const mockAddClone = jest.fn();

jest.mock('../../src/stores/cloneStore', () => ({
  useCloneStore: (sel: (s: unknown) => unknown) =>
    sel({
      creationDraft: draft,
      setCreationDraft: mockSetCreationDraft,
      resetCreationDraft: mockResetCreationDraft,
      addClone: mockAddClone,
    }),

  get: undefined,
}));

jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) =>
    sel({ accessToken: null, user: { id: 1 } }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), replace: jest.fn() }),
  CommonActions: { navigate: jest.fn() },
}));

jest.mock('../../src/stores/dialogStore', () => ({
  showAlert: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../src/components/ui/SafeView', () => {
  const { View } = require('react-native');
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

jest.mock('../../src/components/ui/SafeScrollView', () => {
  const { ScrollView } = require('react-native');
  return ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <ScrollView {...props}>{children}</ScrollView>
  );
});

jest.mock('../../src/components/common/PageHeader', () => {
  const { View } = require('react-native');
  return () => <View />;
});

jest.mock('../../src/components/ui/Button', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ title, onPress }: { title: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress}><Text>{title}</Text></TouchableOpacity>
  );
});

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('../../src/api/clones', () => ({
  createClone: jest.fn(),
  createCloneFeed: jest.fn(),
  updateClone: jest.fn(),
  deriveUsernameFromName: jest.fn((name: string) => `${name}_abc`),
}));

jest.mock('../../src/api/files', () => ({
  uploadFile: jest.fn(),
}));

const { useCloneStore: _uc } = jest.requireMock('../../src/stores/cloneStore');

jest.mock('../../src/stores/cloneStore', () => {
  const mockStore = {
    useCloneStore: (sel: (s: unknown) => unknown) =>
      sel({
        creationDraft: draft,
        setCreationDraft: mockSetCreationDraft,
        resetCreationDraft: mockResetCreationDraft,
        addClone: mockAddClone,
      }),
  };

  (mockStore.useCloneStore as unknown as { getState: () => unknown }).getState = () => ({
    creationDraft: draft,
    setCreationDraft: mockSetCreationDraft,
  });
  return mockStore;
});

import Step7CompleteScreen from '../../src/screens/clone-creation/Step7CompleteScreen';

beforeEach(() => {
  jest.clearAllMocks();
  draft.description = '정 많은 할아버지예요. #추모';
});

test('caption 초기값이 draft.description으로 자동 채워짐', async () => {
  const { getByDisplayValue } = render(
    <Step7CompleteScreen navigation={{} as never} />,
  );
  await waitFor(() => getByDisplayValue('정 많은 할아버지예요. #추모'));
});

test('draft.description 없으면 caption 빈 문자열', async () => {
  draft.description = undefined;
  const { queryByDisplayValue } = render(
    <Step7CompleteScreen navigation={{} as never} />,
  );
  await waitFor(() => {
    expect(queryByDisplayValue('정 많은 할아버지예요. #추모')).toBeNull();
  });
});
