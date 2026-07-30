import { translateApiError } from '../errorI18n';

const mockT = jest.fn();

jest.mock('../../i18n', () => ({
  __esModule: true,
  default: {
    t: (...args: unknown[]) => (mockT as (...a: unknown[]) => string)(...args),
  },
}));

beforeEach(() => {
  mockT.mockReset();
});

describe('translateApiError', () => {
  test('combo match — code + message → i18n key', () => {
    mockT.mockImplementation((key: string) =>
      key === 'errors.accountDeleted' ? 'This account has been deleted.' : '',
    );
    const result = translateApiError('ACCOUNT_DELETED', '이미 탈퇴한 계정이에요.');
    expect(result).toBe('This account has been deleted.');
    expect(mockT).toHaveBeenCalledWith('errors.accountDeleted', { defaultValue: '' });
  });

  test('exact match — message alone → i18n key when combo misses', () => {
    mockT.mockImplementation((key: string) =>
      key === 'errors.personaNotFound' ? 'Persona not found.' : '',
    );
    const result = translateApiError('NOT_FOUND', '페르소나를 찾을 수 없어요.');
    expect(result).toBe('Persona not found.');
  });

  test('regex match with interpolation — {{seconds}}', () => {
    mockT.mockImplementation((key: string, opts?: Record<string, unknown>) => {
      if (key === 'errors.otpCooldown' && opts?.seconds === 24) {
        return '24초 뒤에 다시 요청할 수 있어요.';
      }
      return '';
    });
    const result = translateApiError(
      'OTP_COOLDOWN',
      'Wait 24s before requesting another code.',
    );
    expect(result).toBe('24초 뒤에 다시 요청할 수 있어요.');
  });

  test('regex match — {{n}} attempts', () => {
    mockT.mockImplementation((key: string, opts?: Record<string, unknown>) => {
      if (key === 'errors.otpWrongCodeAttempts' && opts?.n === 3) {
        return 'Wrong code. 3 attempts left.';
      }
      return '';
    });
    const result = translateApiError('OTP_INVALID', 'Wrong code. 3 attempts left.');
    expect(result).toBe('Wrong code. 3 attempts left.');
  });

  test('regex match — face vector prefix', () => {
    mockT.mockImplementation((key: string) =>
      key === 'errors.faceVectorSaveFailed' ? '얼굴 벡터 저장에 실패했어요.' : '',
    );
    const result = translateApiError(
      'UPSTREAM_FAILURE',
      '얼굴 벡터 인덱스 저장 실패: something broke',
    );
    expect(result).toBe('얼굴 벡터 저장에 실패했어요.');
  });

  test('unmapped message → returns original', () => {
    mockT.mockReturnValue('');
    const original = 'Some totally unknown error from server.';
    const result = translateApiError('INTERNAL_ERROR', original);
    expect(result).toBe(original);
  });

  test('empty message → returns as-is', () => {
    const result = translateApiError('INTERNAL_ERROR', '');
    expect(result).toBe('');
    expect(mockT).not.toHaveBeenCalled();
  });

  test('i18n returning key unchanged (missing translation) → falls back to original', () => {
    mockT.mockImplementation((key: string) => key); 
    const original = '페르소나를 찾을 수 없어요.';
    const result = translateApiError('NOT_FOUND', original);
    expect(result).toBe(original);
  });
});
