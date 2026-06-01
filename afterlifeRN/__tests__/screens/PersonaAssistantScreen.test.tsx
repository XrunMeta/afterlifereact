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
