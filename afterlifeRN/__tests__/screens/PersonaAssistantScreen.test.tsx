

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const draftStore: Record<string, unknown> = {
  name: '',
  username: '',
  relation: '',
  personaAnswers: {},
};
const mockSetCreationDraft = jest.fn((patch: Record<string, unknown>) => {
  Object.assign(draftStore, patch);
});
jest.mock('../../src/stores/cloneStore', () => ({
  useCloneStore: (sel: (s: unknown) => unknown) =>
    sel({
      creationDraft: draftStore,
      setCreationDraft: mockSetCreationDraft,
    }),
}));

jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ accessToken: 'tok-test' }),
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
  deriveUsernameFromName: jest.fn((name: string) => `${name}_abc123`),
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
jest.mock('react-native-safe-area-context', () => ({
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

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

const mockNavProp = {
  navigate: mockNavigate,
  goBack: jest.fn(),
};

import PersonaAssistantScreen from '../../src/screens/clone-creation/PersonaAssistantScreen';

beforeEach(() => {
  jest.clearAllMocks();

  Object.assign(draftStore, { name: '', username: '', relation: '', personaAnswers: {} });
  const { getPersonaQuestions, personaSuggest } = require('../../src/api/clones');
  getPersonaQuestions.mockResolvedValue([
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
  personaSuggest.mockResolvedValue({
    personality_core: ['낙천적이고 정 많음', '차분하고 포용적', '고집 있지만 따뜻함', '잔소리 많지만 애정'],
    tone: ['느릿하고 다정한 반말', '정겨운 사투리', '부드러운 말투', '장난기 있는 반말'],
  });
});

test('초기 렌더 시 이름 질문(sys:name)이 표시된다', async () => {
  const { getByText } = render(
    <PersonaAssistantScreen navigation={mockNavProp as any} />,
  );

  await waitFor(() => getByText(/지금 생성하는 클론의 이름/), { timeout: 3000 });
});

test('getPersonaQuestions가 스키마 로드 후 호출되어 질문 목록을 반환한다', async () => {
  const { getPersonaQuestions } = require('../../src/api/clones');
  render(<PersonaAssistantScreen navigation={mockNavProp as any} />);

  expect(getPersonaQuestions).toBeDefined();
  expect(typeof getPersonaQuestions).toBe('function');
});

test('[isVisible] tone 답에 "사투리" 포함 시 dialect_region 질문 표시됨', () => {

  function isVisible(
    q: { showWhen?: Record<string, string> },
    answers: Record<string, string>,
  ): boolean {
    if (!q.showWhen) return true;
    return Object.entries(q.showWhen).every(
      ([refKey, refVal]) => (answers[refKey] ?? '').includes(refVal),
    );
  }

  const dialectQ = {
    key: 'dialect_region',
    showWhen: { tone: '사투리' },
  };

  expect(isVisible(dialectQ, {})).toBe(false);

  expect(isVisible(dialectQ, { tone: '느릿한 반말' })).toBe(false);

  expect(isVisible(dialectQ, { tone: '정겨운 사투리' })).toBe(true);

  expect(isVisible(dialectQ, { tone: '사투리' })).toBe(true);
});

test('[완료 흐름] setCreationDraft 호출 시 personaAnswers 키를 포함한다', async () => {

  const schemaAnswers = {
    personality_core: '낙천적이고 정 많음',
    tone: '정겨운 사투리',
  };

  mockSetCreationDraft({
    name: '할배',
    username: 'halbae_abc',
    relation: 'grandfather',
    personaAnswers: schemaAnswers,
  });

  expect(mockSetCreationDraft).toHaveBeenCalledWith(
    expect.objectContaining({
      personaAnswers: expect.objectContaining({
        personality_core: '낙천적이고 정 많음',
        tone: '정겨운 사투리',
      }),
    }),
  );
});

test('[stale 정리] tone 변경으로 showWhen false가 되면 dialect_region 답이 제거된다', () => {
  const questions = [
    { key: 'tone', type: 'gemma_choice', showWhen: undefined },
    { key: 'dialect_region', type: 'fixed_choice', showWhen: { tone: '사투리' } },
  ] as Array<{ key: string; type: string; showWhen?: Record<string, string> }>;

  function isVisible(q: typeof questions[0], answers: Record<string, string>): boolean {
    if (!q.showWhen) return true;
    return Object.entries(q.showWhen).every(
      ([refKey, refVal]) => (answers[refKey] ?? '').includes(refVal),
    );
  }

  let answers: Record<string, string> = {
    tone: '정겨운 사투리',
    dialect_region: '경상도',
  };

  const newAnswers: Record<string, string> = { ...answers, tone: '느릿한 반말' };

  for (const q of questions) {
    if (q.showWhen && !isVisible(q, newAnswers) && newAnswers[q.key] !== undefined) {
      delete newAnswers[q.key];
    }
  }
  answers = newAnswers;

  expect(answers['dialect_region']).toBeUndefined();
  expect(answers['tone']).toBe('느릿한 반말');
});

test('[폴백] getPersonaQuestions 실패 시 크래시 없이 첫 시스템 질문 렌더', async () => {
  const { getPersonaQuestions } = require('../../src/api/clones');
  getPersonaQuestions.mockRejectedValueOnce(new Error('network error'));

  const { getByText } = render(
    <PersonaAssistantScreen navigation={mockNavProp as any} />,
  );
  await waitFor(() => getByText(/지금 생성하는 클론의 이름/), { timeout: 3000 });

});
