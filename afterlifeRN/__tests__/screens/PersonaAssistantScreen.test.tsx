import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../src/stores/cloneStore', () => {
  const draft: Record<string, unknown> = { name: '할배', personaAnswers: {} };
  return {
    useCloneStore: (sel: (s: unknown) => unknown) =>
      sel({
        creationDraft: draft,
        setCreationDraft: (p: Record<string, unknown>) => Object.assign(draft, p),
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
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ accessToken: 'tok' }),
}));

import PersonaAssistantScreen from '../../src/screens/clone-creation/PersonaAssistantScreen';

beforeEach(() => {
  const { getPersonaQuestions, personaSuggest } = require('../../src/api/clones');
  getPersonaQuestions.mockResolvedValue([
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
  personaSuggest.mockResolvedValue({ tone: ['느릿한 반말', '정겨운 사투리', '부드러운', '장난기'] });
});

test('renders gemma_choice candidates after load', async () => {
  const { getByText } = render(<PersonaAssistantScreen />);
  await waitFor(() => getByText('정겨운 사투리'));
  expect(getByText('말투?')).toBeTruthy();
});

test('selecting 사투리 reveals dialect_region (showWhen)', async () => {
  const { getByText, queryByText } = render(<PersonaAssistantScreen />);
  await waitFor(() => getByText('정겨운 사투리'));

  expect(queryByText('지역?')).toBeNull();

  fireEvent.press(getByText('정겨운 사투리'));
  await waitFor(() => getByText('지역?'));
});

test('[stale 정리] tone을 사투리 아닌 값으로 바꾸면 dialect_region 답이 onNext personaAnswers에서 제거됨', async () => {

  let capturedDraft: Record<string, unknown> = {};
  const mockSetDraft = jest.fn((p: Record<string, unknown>) => {
    capturedDraft = p;
  });
  jest.mock('../../src/stores/cloneStore', () => ({
    useCloneStore: (sel: (s: unknown) => unknown) =>
      sel({
        creationDraft: { name: '할배', personaAnswers: {} },
        setCreationDraft: mockSetDraft,
      }),
  }));

  const cloneStoreMod = require('../../src/stores/cloneStore');
  const originalUseCloneStore = cloneStoreMod.useCloneStore;
  const innerDraft: Record<string, unknown> = { name: '할배', personaAnswers: {} };
  const capturedCalls: Array<Record<string, unknown>> = [];
  cloneStoreMod.useCloneStore = (sel: (s: unknown) => unknown) =>
    sel({
      creationDraft: innerDraft,
      setCreationDraft: (p: Record<string, unknown>) => {
        capturedCalls.push(p);
        Object.assign(innerDraft, p);
      },
    });

  const { getByText, queryByText } = render(<PersonaAssistantScreen />);
  await waitFor(() => getByText('정겨운 사투리'));

  fireEvent.press(getByText('정겨운 사투리'));
  await waitFor(() => getByText('지역?'));

  fireEvent.press(getByText('경상도'));

  fireEvent.press(getByText('느릿한 반말'));
  await waitFor(() => expect(queryByText('지역?')).toBeNull());

  fireEvent.press(getByText('다음'));

  const lastCall = capturedCalls[capturedCalls.length - 1];
  const personaAnswers = lastCall?.personaAnswers as Record<string, string> | undefined;
  expect(personaAnswers).toBeDefined();
  expect(personaAnswers!['dialect_region']).toBeUndefined();
  expect(personaAnswers!['tone']).toBe('느릿한 반말');

  cloneStoreMod.useCloneStore = originalUseCloneStore;
});

test('[폴백] getPersonaQuestions 실패 시 크래시 없이 안내 문구 표시', async () => {
  const { getPersonaQuestions } = require('../../src/api/clones');
  getPersonaQuestions.mockRejectedValueOnce(new Error('network error'));

  const { getByText, findByText } = render(<PersonaAssistantScreen />);
  const notice = await findByText('지금은 도우미를 사용할 수 없어요. 다음으로 진행하세요.');
  expect(notice).toBeTruthy();

  expect(getByText('다음')).toBeTruthy();
});
