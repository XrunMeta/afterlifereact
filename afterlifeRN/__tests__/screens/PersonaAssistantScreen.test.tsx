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
