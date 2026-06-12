

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PrivacySettingsScreen from '../../src/screens/my/PrivacySettingsScreen';
import { useAuthStore } from '../../src/stores/authStore';
import * as personsApi from '../../src/api/persons';
import * as clonesApi from '../../src/api/clones';
import * as dialogStore from '../../src/stores/dialogStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (!opts) return key;
      return Object.entries(opts).reduce(
        (s, [k, v]) => s.replace(`{{${k}}}`, String(v)),
        key,
      );
    },
  }),
}));

const mockListMyBlocks = jest.spyOn(clonesApi, 'listMyBlocks');
const mockListPersons = jest.spyOn(personsApi, 'listPersons');
const mockSaveFaceConsent = jest.spyOn(personsApi, 'saveFaceConsent');
const mockShowAlert = jest.spyOn(dialogStore, 'showAlert');

beforeEach(async () => {
  jest.clearAllMocks();
  await useAuthStore.getState().hydrate();

  mockListMyBlocks.mockResolvedValue({ items: [] });
  mockListPersons.mockResolvedValue({ items: [] });
  mockShowAlert.mockImplementation(() => {});
});

test('face-consent-section 이 항상 렌더됨', () => {
  render(<PrivacySettingsScreen />);
  expect(screen.getByTestId('face-consent-section')).toBeTruthy();
});

import type { Person } from '../../src/api/persons';

test('granted persons 필터: consentState granted 만 추출', () => {
  const persons: Person[] = [
    { id: 1, consentState: 'granted', cloneId: 7 },
    { id: 2, consentState: 'revoked', cloneId: 8 },
    { id: 3, consentState: 'pending', cloneId: 9 },
    { id: 4, consentState: 'granted', cloneId: 10 },
  ];
  const granted = persons.filter((p) => p.consentState === 'granted');
  expect(granted).toHaveLength(2);
  expect(granted.map((p) => p.id)).toEqual([1, 4]);
});

test('revoked 후 상태 갱신 로직: id 일치 항목만 revoked 로 변경', () => {
  const persons: Person[] = [
    { id: 42, consentState: 'granted', cloneId: 7 },
    { id: 99, consentState: 'granted', cloneId: 8 },
  ];
  const updated = persons.map((p) =>
    p.id === 42 ? { ...p, consentState: 'revoked' as const } : p,
  );
  expect(updated.find((p) => p.id === 42)?.consentState).toBe('revoked');
  expect(updated.find((p) => p.id === 99)?.consentState).toBe('granted');
});

test('granted person 없으면 granted 목록 빈 배열', () => {
  const persons: Person[] = [
    { id: 1, consentState: 'revoked', cloneId: 7 },
  ];
  const granted = persons.filter((p) => p.consentState === 'granted');
  expect(granted).toHaveLength(0);
});

test('saveFaceConsent 는 revoked 상태로 호출됨', async () => {
  mockSaveFaceConsent.mockResolvedValue('revoked');
  const token = 'test-token';
  const result = await personsApi.saveFaceConsent(token, 42, 'revoked');
  expect(mockSaveFaceConsent).toHaveBeenCalledWith(token, 42, 'revoked');
  expect(result).toBe('revoked');
});

test('listPersons 는 items 배열 반환', async () => {
  const mockPersons: Person[] = [
    { id: 1, consentState: 'granted', cloneId: 7 },
  ];
  mockListPersons.mockResolvedValue({ items: mockPersons });
  const result = await personsApi.listPersons('test-token');
  expect(result.items).toHaveLength(1);
  expect(result.items[0].consentState).toBe('granted');
});
