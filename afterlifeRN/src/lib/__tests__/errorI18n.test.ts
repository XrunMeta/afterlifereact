import { v_3be591 } from '../errorI18n';

const v_ceba62 = jest.fn();

jest.mock('../../i18n', () => ({
  __esModule: true,
  default: {
    t: (...v_4317d1: unknown[]) => (v_ceba62 as (...a: unknown[]) => string)(...v_4317d1),
  },
}));

beforeEach(() => {
  v_ceba62.mockReset();
});

describe('translateApiError', () => {
  test('combo match — code + message → i18n key', () => {
    v_ceba62.mockImplementation((v_b24339) =>
      v_b24339 === 'errors.accountDeleted' ? 'This account has been deleted.' : '',
    );
    const v_43c42e = v_3be591('ACCOUNT_DELETED', '이미 탈퇴한 계정이에요.');
    expect(v_43c42e).toBe('This account has been deleted.');
    expect(v_ceba62).toHaveBeenCalledWith('errors.accountDeleted', { defaultValue: '' });
  });

  test('exact match — message alone → i18n key when combo misses', () => {
    v_ceba62.mockImplementation((v_b24339) =>
      v_b24339 === 'errors.personaNotFound' ? 'Persona not found.' : '',
    );
    const v_43c42e = v_3be591('NOT_FOUND', '페르소나를 찾을 수 없어요.');
    expect(v_43c42e).toBe('Persona not found.');
  });

  test('regex match with interpolation — {{seconds}}', () => {
    v_ceba62.mockImplementation((v_b24339, v_328259) => {
      if (v_b24339 === 'errors.otpCooldown' && v_328259?.seconds === 24) {
        return '24초 뒤에 다시 요청할 수 있어요.';
      }
      return '';
    });
    const v_43c42e = v_3be591(
      'OTP_COOLDOWN',
      'Wait 24s before requesting another code.',
    );
    expect(v_43c42e).toBe('24초 뒤에 다시 요청할 수 있어요.');
  });

  test('regex match — {{n}} attempts', () => {
    v_ceba62.mockImplementation((v_b24339, v_328259) => {
      if (v_b24339 === 'errors.otpWrongCodeAttempts' && v_328259?.n === 3) {
        return 'Wrong code. 3 attempts left.';
      }
      return '';
    });
    const v_43c42e = v_3be591('OTP_INVALID', 'Wrong code. 3 attempts left.');
    expect(v_43c42e).toBe('Wrong code. 3 attempts left.');
  });

  test('regex match — face vector prefix', () => {
    v_ceba62.mockImplementation((v_b24339) =>
      v_b24339 === 'errors.faceVectorSaveFailed' ? '얼굴 벡터 저장에 실패했어요.' : '',
    );
    const v_43c42e = v_3be591(
      'UPSTREAM_FAILURE',
      '얼굴 벡터 인덱스 저장 실패: something broke',
    );
    expect(v_43c42e).toBe('얼굴 벡터 저장에 실패했어요.');
  });

  test('unmapped message → returns original', () => {
    v_ceba62.mockReturnValue('');
    const v_f7fd54 = 'Some totally unknown error from server.';
    const v_43c42e = v_3be591('INTERNAL_ERROR', v_f7fd54);
    expect(v_43c42e).toBe(v_f7fd54);
  });

  test('empty message → returns as-is', () => {
    const v_43c42e = v_3be591('INTERNAL_ERROR', '');
    expect(v_43c42e).toBe('');
    expect(v_ceba62).not.toHaveBeenCalled();
  });

  test('i18n returning key unchanged (missing translation) → falls back to original', () => {
    v_ceba62.mockImplementation((v_b24339) => v_b24339); 
    const v_f7fd54 = '페르소나를 찾을 수 없어요.';
    const v_43c42e = v_3be591('NOT_FOUND', v_f7fd54);
    expect(v_43c42e).toBe(v_f7fd54);
  });
});
