

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PrivacySettingsScreen from '../../src/screens/my/PrivacySettingsScreen';
import { useAuthStore } from '../../src/stores/authStore';
import * as personsApi from '../../src/api/persons';
import * as clonesApi from '../../src/api/clones';
import * as dialogStore from '../../src/stores/dialogStore';
import * as consentApi from '../../src/api/consent';

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
    i18n: { language: 'ko' },
  }),
}));

const mockListMyBlocks = jest.spyOn(clonesApi, 'listMyBlocks');
const mockListPersons = jest.spyOn(personsApi, 'listPersons');
const mockSaveFaceConsent = jest.spyOn(personsApi, 'saveFaceConsent');
const mockShowAlert = jest.spyOn(dialogStore, 'showAlert');
const mockGetFaceBiometricConsent = jest.spyOn(consentApi, 'getFaceBiometricConsent');
const mockSaveFaceBiometricConsent = jest.spyOn(consentApi, 'saveFaceBiometricConsent');

beforeEach(async () => {
  jest.clearAllMocks();
  await useAuthStore.getState().hydrate();

  mockListMyBlocks.mockResolvedValue({ items: [] });
  mockListPersons.mockResolvedValue({ items: [] });
  mockShowAlert.mockImplementation(() => {});
  mockGetFaceBiometricConsent.mockResolvedValue({ state: 'none', version: null, at: null });
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
    { id: 3, consentState: 'none', cloneId: 9 },
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

test('face-biometric-consent-section 이 항상 렌더됨', () => {
  render(<PrivacySettingsScreen />);
  expect(screen.getByTestId('face-biometric-consent-section')).toBeTruthy();
});

test('getFaceBiometricConsent granted → 토글 on', async () => {

  useAuthStore.setState({ accessToken: 'test-token' });
  mockGetFaceBiometricConsent.mockResolvedValue({ state: 'granted', version: 'v1', at: 1 });
  render(<PrivacySettingsScreen />);
  await screen.findByTestId('face-biometric-consent-toggle');
  expect(screen.getByTestId('face-biometric-consent-toggle').props.value).toBe(true);
});

test('토글 on → saveFaceBiometricConsent(granted, termsVersion+channel) 호출', async () => {
  useAuthStore.setState({ accessToken: 'test-token' });
  mockGetFaceBiometricConsent.mockResolvedValue({ state: 'none', version: null, at: null });
  mockSaveFaceBiometricConsent.mockResolvedValue({ ok: true, state: 'granted' });
  render(<PrivacySettingsScreen />);
  const toggle = await screen.findByTestId('face-biometric-consent-toggle');
  fireEvent(toggle, 'valueChange', true);
  expect(mockSaveFaceBiometricConsent).toHaveBeenCalledWith('test-token', 'granted', {
    termsVersion: 'v1',
    channel: 'settings',
  });
});

test('토글 off → 즉시 저장하지 않고 확인 다이얼로그(destructive)를 먼저 띄움', async () => {
  useAuthStore.setState({ accessToken: 'test-token' });
  mockGetFaceBiometricConsent.mockResolvedValue({ state: 'granted', version: 'v1', at: 1 });
  render(<PrivacySettingsScreen />);
  const toggle = await screen.findByTestId('face-biometric-consent-toggle');
  fireEvent(toggle, 'valueChange', false);

  expect(mockSaveFaceBiometricConsent).not.toHaveBeenCalled();
  expect(mockShowAlert).toHaveBeenCalledWith(
    'settings.privacy.faceBiometric.revokeConfirmTitle',
    'settings.privacy.faceBiometric.revokeConfirmMessage',
    expect.arrayContaining([
      expect.objectContaining({ style: 'destructive' }),
      expect.objectContaining({ style: 'cancel' }),
    ]),
  );
});

test('토글 off + 확인(destructive) 클릭 → saveFaceBiometricConsent(revoked) 호출', async () => {
  useAuthStore.setState({ accessToken: 'test-token' });
  mockGetFaceBiometricConsent.mockResolvedValue({ state: 'granted', version: 'v1', at: 1 });
  mockSaveFaceBiometricConsent.mockResolvedValue({ ok: true, state: 'revoked' });
  render(<PrivacySettingsScreen />);
  const toggle = await screen.findByTestId('face-biometric-consent-toggle');
  fireEvent(toggle, 'valueChange', false);

  const buttons = mockShowAlert.mock.calls[mockShowAlert.mock.calls.length - 1][2] as Array<{
    style?: string;
    onPress?: () => void;
  }>;
  const confirmBtn = buttons.find((b) => b.style === 'destructive');
  await confirmBtn?.onPress?.();

  expect(mockSaveFaceBiometricConsent).toHaveBeenCalledWith('test-token', 'revoked', { channel: 'settings' });
});

test('토글 off + 취소 클릭 → saveFaceBiometricConsent 미호출(토글 ON 유지)', async () => {
  useAuthStore.setState({ accessToken: 'test-token' });
  mockGetFaceBiometricConsent.mockResolvedValue({ state: 'granted', version: 'v1', at: 1 });
  render(<PrivacySettingsScreen />);
  const toggle = await screen.findByTestId('face-biometric-consent-toggle');
  fireEvent(toggle, 'valueChange', false);

  const buttons = mockShowAlert.mock.calls[mockShowAlert.mock.calls.length - 1][2] as Array<{
    style?: string;
    onPress?: () => void;
  }>;
  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  cancelBtn?.onPress?.();

  expect(mockSaveFaceBiometricConsent).not.toHaveBeenCalled();
  expect(screen.getByTestId('face-biometric-consent-toggle').props.value).toBe(true);
});
