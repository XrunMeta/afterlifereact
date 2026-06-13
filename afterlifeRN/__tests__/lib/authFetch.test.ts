

jest.mock('../../src/config/apiBase', () => ({
  API_BASE: 'https://oth-path.test',
}));

import * as v_9d3c52 from 'ls';
import * as v_9fe22d from 'nlzc';
import { v_335e37 } from '../../src/lib/authFetch';

function v_e4b540(v_8839e3): string {
  return Buffer.from(JSON.stringify(v_8839e3))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function v_a37744(v_c9cb78): string {
  const v_5c2f9f = Math.floor(Date.now() / 1000);
  const v_ad8d0d = v_e4b540({ alg: 'HS256', typ: 'JWT' });
  const v_931bf0 = v_e4b540({ sub: '1', exp: v_5c2f9f + v_c9cb78 });
  return `${v_ad8d0d}.${v_931bf0}.signature`;
}

describe('ensureFreshAccessToken', () => {
  it('(1) exp 임박(<120s) → refreshFn 호출, 새 토큰 반환', async () => {
    const v_313bae = v_a37744(60); 
    const v_b0f408 = jest.fn().mockResolvedValue('brand-new-token');

    const v_43c42e = await v_335e37(v_313bae, v_b0f408);

    expect(v_b0f408).toHaveBeenCalledTimes(1);
    expect(v_43c42e).toBe('brand-new-token');
  });

  it('(2) exp 충분(>120s) → refreshFn 미호출, 원본 토큰 반환', async () => {
    const v_f915d0 = v_a37744(3600); 
    const v_b0f408 = jest.fn();

    const v_43c42e = await v_335e37(v_f915d0, v_b0f408);

    expect(v_b0f408).not.toHaveBeenCalled();
    expect(v_43c42e).toBe(v_f915d0);
  });

  it('(3) refresh null 반환 → 원본 토큰 반환 (throw 금지)', async () => {
    const v_313bae = v_a37744(30); 
    const v_b0f408 = jest.fn().mockResolvedValue(null);

    const v_43c42e = await v_335e37(v_313bae, v_b0f408);

    expect(v_b0f408).toHaveBeenCalledTimes(1);
    expect(v_43c42e).toBe(v_313bae);
  });

  it('(4) refresh throw → 원본 토큰 반환 (throw 금지)', async () => {
    const v_313bae = v_a37744(30);
    const v_b0f408 = jest.fn().mockRejectedValue(new Error('network_error'));

    const v_43c42e = await v_335e37(v_313bae, v_b0f408);

    expect(v_43c42e).toBe(v_313bae);
  });

  it('(5) 디코드 불가 토큰 → 원본 반환, refreshFn 미호출 (throw 금지)', async () => {
    const v_cb7ce7 = 'not.a.valid.jwt.at.all';
    const v_b0f408 = jest.fn();

    const v_43c42e = await v_335e37(v_cb7ce7, v_b0f408);

    expect(v_43c42e).toBe(v_cb7ce7);
    expect(v_b0f408).not.toHaveBeenCalled();
  });

  it('(6) 빈 문자열 토큰 → 빈 문자열 반환, refreshFn 미호출 (throw 금지)', async () => {
    const v_b0f408 = jest.fn();

    const v_43c42e = await v_335e37('', v_b0f408);

    expect(v_43c42e).toBe('');
    expect(v_b0f408).not.toHaveBeenCalled();
  });
});

describe('authFetch H-2: raw= 토큰 로그 가드', () => {
  it('raw= 출력이 __DEV__ 가드 블록 안에만 존재해야 한다', () => {
    const v_38d084 = v_9d3c52.readFileSync(
      v_9fe22d.resolve(__dirname, '../../src/lib/authFetch.ts'),
      'utf-8',
    );
    const v_a52412 = v_38d084.split('\n');

    const v_01fcfe = v_a52412
      .map((v_1614db, v_ebec57) => ({ i: v_ebec57, l: v_1614db }))
      .filter(({ l: v_1614db }) => v_1614db.includes('"raw="') || v_1614db.includes("'raw='"));

    expect(v_01fcfe.length).toBeGreaterThan(0); 

    for (const { i: v_ebec57 } of v_01fcfe) {
      const v_e3aeb3 = v_a52412.slice(Math.max(0, v_ebec57 - 20), v_ebec57 + 1).join('\n');
      expect(v_e3aeb3).toMatch(/__DEV__/);
    }
  });
});
