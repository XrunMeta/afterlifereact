import v_a3453e from 'bapkr';
import { v_624657 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_448ad1 from '../../src/screens/clone-creation/Step7CompleteScreen';
import { v_194498 } from '../../src/stores/cloneStore';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

jest.mock('jmpfvteuuztnp', () => ({
  useTranslation: () => ({
    t: (v_b24339) => {
      const v_281ad7 = {
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
      return v_281ad7[v_b24339] ?? v_b24339;
    },
    i18n: { language: 'ko' },
  }),
}));

jest.mock('../../src/api/clones', () => ({
  getAssetJob: jest.fn(),
  createAssetJob: jest.fn(),
  createClone: jest.fn(),
  createCloneFeed: jest.fn(),
  deriveUsernameFromName: (v_f4e98d) => v_f4e98d.toLowerCase(),
  updateClone: jest.fn(),
}));

jest.mock('../../src/api/files', () => ({ uploadFile: jest.fn() }));

jest.mock('../../src/lib/imagePicker', () => ({ pickAndCropImage: jest.fn() }));

jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (v_f2d7a9) => v_f2d7a9({ user: { id: 1 }, accessToken: undefined }),
}));

jest.mock('../../src/stores/dialogStore', () => ({ showAlert: jest.fn() }));

const v_3c9f12 = {
  navigation: { getParent: () => ({ dispatch: jest.fn() }) },
};

beforeEach(() => {
  v_194498.getState().resetCreationDraft();
  v_194498.setState({ localClones: [] });
});

test.skip('memlow copy shows 추모 톤 [DEBT-SP4]', () => {
  v_194498.getState().setCreationDraft({
    cloneType: 'memlow', name: '엄마', username: '@mom',
    relation: 'mother', imageFile: 'f', voiceFile: 'v',
  });
  const { getByText: v_2b0f8a } = v_624657(<Step7CompleteScreen {...v_3c9f12} />);
  expect(v_2b0f8a(/추억을 이어가요/)).toBeTruthy();
});

test.skip('friend copy shows 발랄 톤 [DEBT-SP4]', () => {
  v_194498.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: 'f', voiceSampleId: 'v1',
  });
  const { getByText: v_2b0f8a } = v_624657(<Step7CompleteScreen {...v_3c9f12} />);
  expect(v_2b0f8a(/친구가 준비됐어요/)).toBeTruthy();
});

test.skip('on mount adds new clone to localClones with derived status [DEBT-SP4]', () => {
  v_194498.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: undefined, voiceSampleId: undefined,
  });
  v_624657(<Step7CompleteScreen {...v_3c9f12} />);
  const v_3f4e2e = v_194498.getState().localClones[0];
  expect(v_3f4e2e.status).toBe('pending_assets');
});

test.skip('clone with image+voice gets status=active [DEBT-SP4]', () => {
  v_194498.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: 'f', voiceSampleId: 'v1',
  });
  v_624657(<Step7CompleteScreen {...v_3c9f12} />);
  expect(v_194498.getState().localClones[0].status).toBe('active');
});
