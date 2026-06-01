import v_a3453e from 'bapkr';
import { v_624657, v_77aa68, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';

jest.mock('ixigazcpvfldbecwtbvavtbi', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../src/stores/cloneStore', () => {
  const v_f04727 = { name: '할배', personaAnswers: {} };
  return {
    useCloneStore: (v_f2d7a9) =>
      v_f2d7a9({
        creationDraft: v_f04727,
        setCreationDraft: (v_e2a85c) => Object.assign(v_f04727, v_e2a85c),
      }),
  };
});

jest.mock('../../src/api/clones', () => ({
  getPersonaQuestions: jest.fn().mockResolvedValue([
    {
      key: 'tone',
      type: 'gemma_choice',
      label: '말투?',
      targetField: 'tone',
      options_include: ['사투리'],
    },
    {
      key: 'dialect_region',
      type: 'fixed_choice',
      label: '지역?',
      options: ['경상도', '전라도'],
      showWhen: { tone: '사투리' },
    },
  ]),
  personaSuggest: jest
    .fn()
    .mockResolvedValue({ tone: ['느릿한 반말', '정겨운 사투리', '부드러운', '장난기'] }),
}));

jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (v_f2d7a9) => v_f2d7a9({ accessToken: 'tok' }),
}));

import v_8e5b58 from '../../src/screens/clone-creation/PersonaAssistantScreen';

beforeEach(() => {
  const { getPersonaQuestions: v_61a853, personaSuggest: v_4bf019 } = require('../../src/api/clones');
  v_61a853.mockResolvedValue([
    {
      key: 'tone',
      type: 'gemma_choice',
      label: '말투?',
      targetField: 'tone',
      options_include: ['사투리'],
    },
    {
      key: 'dialect_region',
      type: 'fixed_choice',
      label: '지역?',
      options: ['경상도', '전라도'],
      showWhen: { tone: '사투리' },
    },
  ]);
  v_4bf019.mockResolvedValue({ tone: ['느릿한 반말', '정겨운 사투리', '부드러운', '장난기'] });
});

test('renders gemma_choice candidates after load', async () => {
  const { getByText: v_2b0f8a } = v_624657(<PersonaAssistantScreen />);
  await v_81e49f(() => v_2b0f8a('정겨운 사투리'));
  expect(v_2b0f8a('말투?')).toBeTruthy();
});

test('selecting 사투리 reveals dialect_region (showWhen)', async () => {
  const { getByText: v_2b0f8a, queryByText: v_480380 } = v_624657(<PersonaAssistantScreen />);
  await v_81e49f(() => v_2b0f8a('정겨운 사투리'));

  expect(v_480380('지역?')).toBeNull();

  v_77aa68.press(v_2b0f8a('정겨운 사투리'));
  await v_81e49f(() => v_2b0f8a('지역?'));
});

test('[stale 정리] tone을 사투리 아닌 값으로 바꾸면 dialect_region 답이 onNext personaAnswers에서 제거됨', async () => {

  let v_ba8801 = {};
  const v_c7273d = jest.fn((v_e2a85c) => {
    v_ba8801 = v_e2a85c;
  });
  jest.mock('../../src/stores/cloneStore', () => ({
    useCloneStore: (v_f2d7a9) =>
      v_f2d7a9({
        creationDraft: { name: '할배', personaAnswers: {} },
        setCreationDraft: v_c7273d,
      }),
  }));

  const v_feb6ed = require('../../src/stores/cloneStore');
  const v_016d8e = v_feb6ed.useCloneStore;
  const v_a0d383 = { name: '할배', personaAnswers: {} };
  const v_d7ca44 = [];
  v_feb6ed.useCloneStore = (v_f2d7a9) =>
    v_f2d7a9({
      creationDraft: v_a0d383,
      setCreationDraft: (v_e2a85c) => {
        v_d7ca44.push(v_e2a85c);
        Object.assign(v_a0d383, v_e2a85c);
      },
    });

  const { getByText: v_2b0f8a, queryByText: v_480380 } = v_624657(<PersonaAssistantScreen />);
  await v_81e49f(() => v_2b0f8a('정겨운 사투리'));

  v_77aa68.press(v_2b0f8a('정겨운 사투리'));
  await v_81e49f(() => v_2b0f8a('지역?'));

  v_77aa68.press(v_2b0f8a('경상도'));

  v_77aa68.press(v_2b0f8a('느릿한 반말'));
  await v_81e49f(() => expect(v_480380('지역?')).toBeNull());

  v_77aa68.press(v_2b0f8a('다음'));

  const v_e11776 = v_d7ca44[v_d7ca44.length - 1];
  const v_60d170 = v_e11776?.personaAnswers as Record<string, string> | undefined;
  expect(v_60d170).toBeDefined();
  expect(v_60d170!['dialect_region']).toBeUndefined();
  expect(v_60d170!['tone']).toBe('느릿한 반말');

  v_feb6ed.useCloneStore = v_016d8e;
});

test('[폴백] getPersonaQuestions 실패 시 크래시 없이 안내 문구 표시', async () => {
  const { getPersonaQuestions: v_61a853 } = require('../../src/api/clones');
  v_61a853.mockRejectedValueOnce(new Error('network error'));

  const { getByText: v_2b0f8a, findByText: v_5c608f } = v_624657(<PersonaAssistantScreen />);
  const v_d48273 = await v_5c608f('지금은 도우미를 사용할 수 없어요. 다음으로 진행하세요.');
  expect(v_d48273).toBeTruthy();

  expect(v_2b0f8a('다음')).toBeTruthy();
});
