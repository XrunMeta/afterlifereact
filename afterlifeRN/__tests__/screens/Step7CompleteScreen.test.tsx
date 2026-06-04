import React from 'react';
import { render } from '@testing-library/react-native';
import Step7CompleteScreen from '../../src/screens/clone-creation/Step7CompleteScreen';
import { useCloneStore } from '../../src/stores/cloneStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const MAP: Record<string, string> = {
        'create.complete.memlowTitle': '추억을 이어가요',
        'create.complete.memlowSub': '편지가 도착했을 때 함께 읽어봐요.',
        'create.complete.friendTitle': '친구가 준비됐어요',
        'create.complete.friendSub': '첫 대화를 시작해 볼까요?',
        'create.complete.mentorTitle': '멘토가 준비됐어요',
        'create.complete.mentorSub': '분야별 질문을 남겨 보세요.',
        'create.complete.celebTitle': '팬클럽이 시작됐어요',
        'create.complete.celebSub': '첫 메시지를 남겨 보세요.',
        'create.complete.featAutoLearn': '자동 학습',
        'create.complete.featAutoLearnDesc': '대화를 나눌수록 클론이 더 똑똑해져요',
        'create.complete.featSecurity': '데이터 보안',
        'create.complete.featSecurityDesc': '모든 데이터는 안전하게 암호화되어 보호됩니다',
      };
      return MAP[key] ?? key;
    },
    i18n: { language: 'ko' },
  }),
}));

jest.mock('../../src/api/clones', () => ({
  getAssetJob: jest.fn(),
  createAssetJob: jest.fn(),
  createClone: jest.fn(),
  createCloneFeed: jest.fn(),
  deriveUsernameFromName: (n: string) => n.toLowerCase(),
  updateClone: jest.fn(),
}));

jest.mock('../../src/api/files', () => ({ uploadFile: jest.fn() }));

jest.mock('../../src/lib/imagePicker', () => ({ pickAndCropImage: jest.fn() }));

jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (sel: any) => sel({ user: { id: 1 }, accessToken: undefined }),
}));

jest.mock('../../src/stores/dialogStore', () => ({ showAlert: jest.fn() }));

const nav: any = {
  navigation: { getParent: () => ({ dispatch: jest.fn() }) },
};

beforeEach(() => {
  useCloneStore.getState().resetCreationDraft();
  useCloneStore.setState({ localClones: [] });
});

test.skip('memlow copy shows 추모 톤 [DEBT-SP4]', () => {
  useCloneStore.getState().setCreationDraft({
    cloneType: 'memlow', name: '엄마', username: '@mom',
    relation: 'mother', imageFile: 'f', voiceFile: 'v',
  });
  const { getByText } = render(<Step7CompleteScreen {...nav} />);
  expect(getByText(/추억을 이어가요/)).toBeTruthy();
});

test.skip('friend copy shows 발랄 톤 [DEBT-SP4]', () => {
  useCloneStore.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: 'f', voiceSampleId: 'v1',
  });
  const { getByText } = render(<Step7CompleteScreen {...nav} />);
  expect(getByText(/친구가 준비됐어요/)).toBeTruthy();
});

test.skip('on mount adds new clone to localClones with derived status [DEBT-SP4]', () => {
  useCloneStore.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: undefined, voiceSampleId: undefined,
  });
  render(<Step7CompleteScreen {...nav} />);
  const c = useCloneStore.getState().localClones[0];
  expect(c.status).toBe('pending_assets');
});

test.skip('clone with image+voice gets status=active [DEBT-SP4]', () => {
  useCloneStore.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: 'f', voiceSampleId: 'v1',
  });
  render(<Step7CompleteScreen {...nav} />);
  expect(useCloneStore.getState().localClones[0].status).toBe('active');
});
