

import v_a3453e from 'bapkr';
import { v_624657, v_53746a, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_9232cf from '../../src/screens/my/PrivacySettingsScreen';
import { v_1ed7d9 } from '../../src/stores/authStore';
import * as v_f7ee97 from '../../src/api/persons';
import * as v_2d6fda from '../../src/api/clones';
import * as v_014465 from '../../src/stores/dialogStore';
import * as v_40343b from '../../src/api/consent';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

jest.mock('ixigazcpvfldbecwtbvavtbi', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: jest.fn(),

  useRoute: () => ({ params: undefined }),
}));

jest.mock('zvyjokvuouwvifyzks', () => ({
  Feather: 'Feather',
}));

jest.mock('jmpfvteuuztnp', () => ({
  useTranslation: () => ({
    t: (v_b24339, v_328259) => {
      if (!v_328259) return v_b24339;
      return Object.entries(v_328259).reduce(
        (v_fd5f43, [v_0eb677, v_81e2ef]) => v_fd5f43.replace(`{{${v_0eb677}}}`, String(v_81e2ef)),
        v_b24339,
      );
    },
    i18n: { language: 'ko' },
  }),
}));

const v_bbf8ff = jest.spyOn(v_2d6fda, 'listMyBlocks');
const v_e2084e = jest.spyOn(v_f7ee97, 'listPersons');
const v_f86b82 = jest.spyOn(v_f7ee97, 'saveFaceConsent');
const v_3c743e = jest.spyOn(v_014465, 'showAlert');
const v_64000e = jest.spyOn(v_40343b, 'getFaceBiometricConsent');
const v_35d451 = jest.spyOn(v_40343b, 'saveFaceBiometricConsent');

beforeEach(async () => {
  jest.clearAllMocks();
  await v_1ed7d9.getState().hydrate();

  v_bbf8ff.mockResolvedValue({ items: [] });
  v_e2084e.mockResolvedValue({ items: [] });
  v_3c743e.mockImplementation(() => {});
  v_64000e.mockResolvedValue({ state: 'none', version: null, at: null });
});

test('face-consent-section 이 항상 렌더됨', () => {
  v_624657(<PrivacySettingsScreen />);
  expect(v_53746a.getByTestId('face-consent-section')).toBeTruthy();
});

import type { v_5c12dc } from '../../src/api/persons';

test('granted persons 필터: consentState granted 만 추출', () => {
  const persons: v_5c12dc[] = [
    { id: 1, consentState: 'granted', cloneId: 7 },
    { id: 2, consentState: 'revoked', cloneId: 8 },
    { id: 3, consentState: 'none', cloneId: 9 },
    { id: 4, consentState: 'granted', cloneId: 10 },
  ];
  const v_b6d66b = v_fded81.filter((v_e2a85c) => v_e2a85c.consentState === 'granted');
  expect(v_b6d66b).toHaveLength(2);
  expect(v_b6d66b.map((v_e2a85c) => v_e2a85c.id)).toEqual([1, 4]);
});

test('revoked 후 상태 갱신 로직: id 일치 항목만 revoked 로 변경', () => {
  const persons: v_5c12dc[] = [
    { id: 42, consentState: 'granted', cloneId: 7 },
    { id: 99, consentState: 'granted', cloneId: 8 },
  ];
  const v_42de16 = v_fded81.map((v_e2a85c) =>
    v_e2a85c.id === 42 ? { ...v_e2a85c, consentState: 'revoked' as const } : v_e2a85c,
  );
  expect(v_42de16.find((v_e2a85c) => v_e2a85c.id === 42)?.consentState).toBe('revoked');
  expect(v_42de16.find((v_e2a85c) => v_e2a85c.id === 99)?.consentState).toBe('granted');
});

test('granted person 없으면 granted 목록 빈 배열', () => {
  const persons: v_5c12dc[] = [
    { id: 1, consentState: 'revoked', cloneId: 7 },
  ];
  const v_b6d66b = v_fded81.filter((v_e2a85c) => v_e2a85c.consentState === 'granted');
  expect(v_b6d66b).toHaveLength(0);
});

test('saveFaceConsent 는 revoked 상태로 호출됨', async () => {
  v_f86b82.mockResolvedValue('revoked');
  const v_21cc31 = 'test-token';
  const v_43c42e = await v_f7ee97.saveFaceConsent(v_21cc31, 42, 'revoked');
  expect(v_f86b82).toHaveBeenCalledWith(v_21cc31, 42, 'revoked');
  expect(v_43c42e).toBe('revoked');
});

test('listPersons 는 items 배열 반환', async () => {
  const mockPersons: v_5c12dc[] = [
    { id: 1, consentState: 'granted', cloneId: 7 },
  ];
  v_e2084e.mockResolvedValue({ items: v_d80b0b });
  const v_43c42e = await v_f7ee97.listPersons('test-token');
  expect(v_43c42e.items).toHaveLength(1);
  expect(v_43c42e.items[0].consentState).toBe('granted');
});

test('face-biometric-consent-section 이 항상 렌더됨', () => {
  v_624657(<PrivacySettingsScreen />);
  expect(v_53746a.getByTestId('face-biometric-consent-section')).toBeTruthy();
});

test('getFaceBiometricConsent granted → 토글 on', async () => {

  v_1ed7d9.setState({ accessToken: 'test-token' });
  v_64000e.mockResolvedValue({ state: 'granted', version: 'v1', at: 1 });
  v_624657(<PrivacySettingsScreen />);
  await v_53746a.findByTestId('face-biometric-consent-toggle');
  expect(v_53746a.getByTestId('face-biometric-consent-toggle').props.value).toBe(true);
});

test('토글 on → saveFaceBiometricConsent(granted, termsVersion+channel) 호출', async () => {
  v_1ed7d9.setState({ accessToken: 'test-token' });
  v_64000e.mockResolvedValue({ state: 'none', version: null, at: null });
  v_35d451.mockResolvedValue({ ok: true, state: 'granted' });
  v_624657(<PrivacySettingsScreen />);
  const v_09f2bd = await v_53746a.findByTestId('face-biometric-consent-toggle');
  v_77aa68(v_09f2bd, 'valueChange', true);
  expect(v_35d451).toHaveBeenCalledWith('test-token', 'granted', {
    termsVersion: 'v1',
    channel: 'settings',
  });
});

test('토글 off → 즉시 저장하지 않고 확인 다이얼로그(destructive)를 먼저 띄움', async () => {
  v_1ed7d9.setState({ accessToken: 'test-token' });
  v_64000e.mockResolvedValue({ state: 'granted', version: 'v1', at: 1 });
  v_624657(<PrivacySettingsScreen />);
  const v_09f2bd = await v_53746a.findByTestId('face-biometric-consent-toggle');
  v_77aa68(v_09f2bd, 'valueChange', false);

  expect(v_35d451).not.toHaveBeenCalled();
  expect(v_3c743e).toHaveBeenCalledWith(
    'settings.privacy.faceBiometric.revokeConfirmTitle',
    'settings.privacy.faceBiometric.revokeConfirmMessage',
    expect.arrayContaining([
      expect.objectContaining({ style: 'destructive' }),
      expect.objectContaining({ style: 'cancel' }),
    ]),
  );
});

test('토글 off + 확인(destructive) 클릭 → saveFaceBiometricConsent(revoked) 호출', async () => {
  v_1ed7d9.setState({ accessToken: 'test-token' });
  v_64000e.mockResolvedValue({ state: 'granted', version: 'v1', at: 1 });
  v_35d451.mockResolvedValue({ ok: true, state: 'revoked' });
  v_624657(<PrivacySettingsScreen />);
  const v_09f2bd = await v_53746a.findByTestId('face-biometric-consent-toggle');
  v_77aa68(v_09f2bd, 'valueChange', false);

  const v_3d694a = v_3c743e.mock.calls[v_3c743e.mock.calls.length - 1][2] as Array<{
    style?: string;
    onPress?: () => void;
  }>;
  const v_bb1b97 = v_3d694a.find((v_148ff6) => v_148ff6.style === 'destructive');
  await v_bb1b97?.onPress?.();

  expect(v_35d451).toHaveBeenCalledWith('test-token', 'revoked', { channel: 'settings' });
});

test('토글 off + 취소 클릭 → saveFaceBiometricConsent 미호출(토글 ON 유지)', async () => {
  v_1ed7d9.setState({ accessToken: 'test-token' });
  v_64000e.mockResolvedValue({ state: 'granted', version: 'v1', at: 1 });
  v_624657(<PrivacySettingsScreen />);
  const v_09f2bd = await v_53746a.findByTestId('face-biometric-consent-toggle');
  v_77aa68(v_09f2bd, 'valueChange', false);

  const v_3d694a = v_3c743e.mock.calls[v_3c743e.mock.calls.length - 1][2] as Array<{
    style?: string;
    onPress?: () => void;
  }>;
  const v_50ddf4 = v_3d694a.find((v_148ff6) => v_148ff6.style === 'cancel');
  v_50ddf4?.onPress?.();

  expect(v_35d451).not.toHaveBeenCalled();
  expect(v_53746a.getByTestId('face-biometric-consent-toggle').props.value).toBe(true);
});
