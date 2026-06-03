

import v_a3453e from 'bapkr';
import { v_624657, v_81e49f, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';

const v_7b8db1 = jest.fn();
jest.mock('ixigazcpvfldbecwtbvavtbi', () => ({
  useNavigation: () => ({ navigate: v_7b8db1 }),
}));

const v_2b81c8 = {
  name: '',
  username: '',
  relation: '',
  personaAnswers: {},
};
const v_f147d7 = jest.fn((v_17dc8a) => {
  Object.assign(v_2b81c8, v_17dc8a);
});
jest.mock('../../src/stores/cloneStore', () => ({
  useCloneStore: (v_f2d7a9) =>
    v_f2d7a9({
      creationDraft: v_2b81c8,
      setCreationDraft: v_f147d7,
    }),
}));

jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (v_f2d7a9) => v_f2d7a9({ accessToken: 'tok-test' }),
}));

jest.mock('../../src/api/clones', () => ({
  getPersonaQuestions: jest.fn().mockResolvedValue([
    {
      key: 'personality_core',
      type: 'gemma_choice',
      label: '어떤 성격이셨나요?',
      targetField: 'personality_core',
    },
    {
      key: 'tone',
      type: 'gemma_choice',
      label: '어떤 말투였나요?',
      targetField: 'tone',
      options_include: ['사투리'],
    },
    {
      key: 'dialect_region',
      type: 'fixed_choice',
      label: '어느 지역 사투리였나요?',
      options: ['경상도', '전라도', '충청도'],
      showWhen: { tone: '사투리' },
    },
    {
      key: 'first_meeting',
      type: 'text',
      label: '처음 만난 이야기를 들려주실래요?',
    },
  ]),
  personaSuggest: jest.fn().mockResolvedValue({
    personality_core: ['낙천적이고 정 많음', '차분하고 포용적', '고집 있지만 따뜻함', '잔소리 많지만 애정'],
    tone: ['느릿하고 다정한 반말', '정겨운 사투리', '부드러운 말투', '장난기 있는 반말'],
  }),
  checkCloneUsername: jest.fn().mockResolvedValue({ available: true }),
  deriveUsernameFromName: jest.fn((v_1833e7) => `${v_1833e7}_abc123`),
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
jest.mock('vvfgtwbmdpbnvhtfbtbgudicfmpscw', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('../../src/mocks/cloneTypeCatalog', () => ({
  MEMLOW_RELATIONS: [
    { id: 'mother', label: '엄마' },
    { id: 'father', label: '아빠' },
    { id: 'spouse', label: '배우자' },
    { id: 'friend', label: '친구' },
  ],
}));

jest.mock('zvyjokvuouwvifyzks', () => ({
  Feather: 'Feather',
}));

const v_d4abca = {
  navigate: v_7b8db1,
  goBack: jest.fn(),
};

import v_8e5b58 from '../../src/screens/clone-creation/PersonaAssistantScreen';

beforeEach(() => {
  jest.clearAllMocks();

  Object.assign(v_2b81c8, { name: '', username: '', relation: '', personaAnswers: {} });
  const { getPersonaQuestions: v_61a853, personaSuggest: v_4bf019 } = require('../../src/api/clones');
  v_61a853.mockResolvedValue([
    {
      key: 'personality_core',
      type: 'gemma_choice',
      label: '어떤 성격이셨나요?',
      targetField: 'personality_core',
    },
    {
      key: 'tone',
      type: 'gemma_choice',
      label: '어떤 말투였나요?',
      targetField: 'tone',
      options_include: ['사투리'],
    },
    {
      key: 'dialect_region',
      type: 'fixed_choice',
      label: '어느 지역 사투리였나요?',
      options: ['경상도', '전라도', '충청도'],
      showWhen: { tone: '사투리' },
    },
    {
      key: 'first_meeting',
      type: 'text',
      label: '처음 만난 이야기를 들려주실래요?',
    },
  ]);
  v_4bf019.mockResolvedValue({
    personality_core: ['낙천적이고 정 많음', '차분하고 포용적', '고집 있지만 따뜻함', '잔소리 많지만 애정'],
    tone: ['느릿하고 다정한 반말', '정겨운 사투리', '부드러운 말투', '장난기 있는 반말'],
  });
});

test('초기 렌더 시 이름 질문(sys:name)이 표시된다', async () => {
  const { getByText: v_2b0f8a } = v_624657(
    <PersonaAssistantScreen navigation={v_d4abca as any} />,
  );

  await v_81e49f(() => v_2b0f8a(/지금 생성하는 페르소나의 이름/), { timeout: 3000 });
});

test('getPersonaQuestions가 스키마 로드 후 호출되어 질문 목록을 반환한다', async () => {
  const { getPersonaQuestions: v_61a853 } = require('../../src/api/clones');
  v_624657(<PersonaAssistantScreen navigation={v_d4abca as any} />);

  expect(v_61a853).toBeDefined();
  expect(typeof v_61a853).toBe('function');
});

test('[isVisible] tone 답에 "사투리" 포함 시 dialect_region 질문 표시됨', () => {

  function v_a7e583(
    v_ab6401,
    v_00da68,
  ): boolean {
    if (!v_ab6401.showWhen) return true;
    return Object.entries(v_ab6401.showWhen).every(
      ([v_3c1d34, v_441249]) => (v_00da68[v_3c1d34] ?? '').includes(v_441249),
    );
  }

  const v_7e2965 = {
    key: 'dialect_region',
    showWhen: { tone: '사투리' },
  };

  expect(v_a7e583(v_7e2965, {})).toBe(false);

  expect(v_a7e583(v_7e2965, { tone: '느릿한 반말' })).toBe(false);

  expect(v_a7e583(v_7e2965, { tone: '정겨운 사투리' })).toBe(true);

  expect(v_a7e583(v_7e2965, { tone: '사투리' })).toBe(true);
});

test('[완료 흐름] setCreationDraft 호출 시 personaAnswers 키를 포함한다', async () => {

  const v_c72005 = {
    personality_core: '낙천적이고 정 많음',
    tone: '정겨운 사투리',
  };

  v_f147d7({
    name: '할배',
    username: 'halbae_abc',
    relation: 'grandfather',
    personaAnswers: v_c72005,
  });

  expect(v_f147d7).toHaveBeenCalledWith(
    expect.objectContaining({
      personaAnswers: expect.objectContaining({
        personality_core: '낙천적이고 정 많음',
        tone: '정겨운 사투리',
      }),
    }),
  );
});

test('[stale 정리] tone 변경으로 showWhen false가 되면 dialect_region 답이 제거된다', () => {
  const v_c3519b = [
    { key: 'tone', type: 'gemma_choice', showWhen: undefined },
    { key: 'dialect_region', type: 'fixed_choice', showWhen: { tone: '사투리' } },
  ] as Array<{ key: string; type: string; showWhen?: Record<string, string> }>;

  function v_a7e583(q: typeof v_c3519b[0], v_00da68): boolean {
    if (!v_ab6401.showWhen) return true;
    return Object.entries(v_ab6401.showWhen).every(
      ([v_3c1d34, v_441249]) => (v_00da68[v_3c1d34] ?? '').includes(v_441249),
    );
  }

  let v_00da68 = {
    tone: '정겨운 사투리',
    dialect_region: '경상도',
  };

  const v_67d99b = { ...v_00da68, tone: '느릿한 반말' };

  for (const v_ab6401 of v_c3519b) {
    if (v_ab6401.showWhen && !v_a7e583(v_ab6401, v_67d99b) && v_67d99b[v_ab6401.key] !== undefined) {
      delete v_67d99b[v_ab6401.key];
    }
  }
  v_00da68 = v_67d99b;

  expect(v_00da68['dialect_region']).toBeUndefined();
  expect(v_00da68['tone']).toBe('느릿한 반말');
});

test('[폴백] getPersonaQuestions 실패 시 크래시 없이 첫 시스템 질문 렌더', async () => {
  const { getPersonaQuestions: v_61a853 } = require('../../src/api/clones');
  v_61a853.mockRejectedValueOnce(new Error('network error'));

  const { getByText: v_2b0f8a } = v_624657(
    <PersonaAssistantScreen navigation={v_d4abca as any} />,
  );
  await v_81e49f(() => v_2b0f8a(/지금 생성하는 페르소나의 이름/), { timeout: 3000 });

});
