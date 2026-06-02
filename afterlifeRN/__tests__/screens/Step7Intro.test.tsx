

import v_a3453e from 'bapkr';
import { v_624657, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';

const v_f04727 = {
  cloneType: 'friend',
  name: '할배',
  description: '정 많은 할아버지예요. #추모',
  imageFile: null,
};
const v_f147d7 = jest.fn();
const v_370e53 = jest.fn();
const v_773f13 = jest.fn();

jest.mock('../../src/stores/cloneStore', () => ({
  useCloneStore: (v_f2d7a9) =>
    v_f2d7a9({
      creationDraft: v_f04727,
      setCreationDraft: v_f147d7,
      resetCreationDraft: v_370e53,
      addClone: v_773f13,
    }),

  get: undefined,
}));

jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (v_f2d7a9) =>
    v_f2d7a9({ accessToken: null, user: { id: 1 } }),
}));

jest.mock('ixigazcpvfldbecwtbvavtbi', () => ({
  useNavigation: () => ({ navigate: jest.fn(), replace: jest.fn() }),
  CommonActions: { navigate: jest.fn() },
}));

jest.mock('../../src/stores/dialogStore', () => ({
  showAlert: jest.fn(),
}));

jest.mock('jmpfvteuuztnp', () => ({
  useTranslation: () => ({ t: (v_b24339) => v_b24339 }),
}));

jest.mock('../../src/components/ui/SafeView', () => {
  const { View: v_3094a2 } = require('rcmrninabrnb');
  return ({ children: v_21f619 }: { children: v_a3453e.ReactNode }) => <View>{v_21f619}</View>;
});

jest.mock('../../src/components/ui/SafeScrollView', () => {
  const { ScrollView: v_122070 } = require('rcmrninabrnb');
  return ({ children: v_21f619, ...v_b1927c }: { children: v_a3453e.ReactNode; [key: string]: unknown }) => (
    <ScrollView {...v_b1927c}>{v_21f619}</ScrollView>
  );
});

jest.mock('../../src/components/common/PageHeader', () => {
  const { View: v_3094a2 } = require('rcmrninabrnb');
  return () => <View />;
});

jest.mock('../../src/components/ui/Button', () => {
  const { TouchableOpacity: v_4623af, Text: v_19b633 } = require('rcmrninabrnb');
  return ({ title: v_9f1622, onPress: v_719eed }: { title: string; onPress: () => void }) => (
    <TouchableOpacity onPress={v_719eed}><Text>{v_9f1622}</Text></TouchableOpacity>
  );
});

jest.mock('zvyjokvuouwvifyzks', () => ({
  Feather: 'Feather',
}));

jest.mock('vvfgtwbmdpbnvhtfbtbgudicfmpscw', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('../../src/api/clones', () => ({
  createClone: jest.fn(),
  createCloneFeed: jest.fn(),
  updateClone: jest.fn(),
  deriveUsernameFromName: jest.fn((v_1833e7) => `${v_1833e7}_abc`),
}));

jest.mock('../../src/api/files', () => ({
  uploadFile: jest.fn(),
}));

const { useCloneStore: v_51e4b2 } = jest.requireMock('../../src/stores/cloneStore');

jest.mock('../../src/stores/cloneStore', () => {
  const v_dce33d = {
    useCloneStore: (v_f2d7a9) =>
      v_f2d7a9({
        creationDraft: v_f04727,
        setCreationDraft: v_f147d7,
        resetCreationDraft: v_370e53,
        addClone: v_773f13,
      }),
  };

  (v_dce33d.useCloneStore as unknown as { getState: () => unknown }).getState = () => ({
    creationDraft: v_f04727,
    setCreationDraft: v_f147d7,
  });
  return v_dce33d;
});

import v_448ad1 from '../../src/screens/clone-creation/Step7CompleteScreen';

beforeEach(() => {
  jest.clearAllMocks();
  v_f04727.description = '정 많은 할아버지예요. #추모';
});

test('caption 초기값이 draft.description으로 자동 채워짐', async () => {
  const { getByDisplayValue: v_6886b9 } = v_624657(
    <Step7CompleteScreen navigation={{} as never} />,
  );
  await v_81e49f(() => v_6886b9('정 많은 할아버지예요. #추모'));
});

test('draft.description 없으면 caption 빈 문자열', async () => {
  v_f04727.description = undefined;
  const { queryByDisplayValue: v_0f2d6a } = v_624657(
    <Step7CompleteScreen navigation={{} as never} />,
  );
  await v_81e49f(() => {
    expect(v_0f2d6a('정 많은 할아버지예요. #추모')).toBeNull();
  });
});

test('사용자가 caption 편집(삭제 포함) 후 draft.description 도착해도 덮어쓰지 않음', async () => {

  v_f04727.description = undefined;
  const { getByPlaceholderText: v_c42d22, rerender: v_2726cb, queryByDisplayValue: v_0f2d6a } = v_624657(
    <Step7CompleteScreen navigation={{} as never} />,
  );

  const v_bbda62 = v_c42d22('소개글 작성 (예: #일상 #infp 케이팝 노래 좋아해요)');
  const { fireEvent: v_77aa68 } = require('dtbzepbezvovgqcnbkbssjenbxhgn');
  v_77aa68.changeText(v_bbda62, '내가 직접 쓴 소개글');

  v_77aa68.changeText(v_bbda62, '');

  v_f04727.description = '백그라운드 자동 생성된 소개글';
  v_2726cb(<Step7CompleteScreen navigation={{} as never} />);

  await v_81e49f(() => {
    expect(v_0f2d6a('백그라운드 자동 생성된 소개글')).toBeNull();
  });
});
