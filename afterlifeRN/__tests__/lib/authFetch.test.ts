

jest.mock('../../src/config/apiBase', () => ({
  API_BASE: 'https://oth-path.test',
}));

import * as fs from 'fs';
import * as path from 'path';
import { ensureFreshAccessToken } from '../../src/lib/authFetch';

function b64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function makeJwt(expOffsetSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({ sub: '1', exp: now + expOffsetSeconds });
  return `${header}.${payload}.signature`;
}

describe('ensureFreshAccessToken', () => {
  it('(1) exp 임박(<120s) → refreshFn 호출, 새 토큰 반환', async () => {
    const staleToken = makeJwt(60); 
    const mockRefreshFn = jest.fn().mockResolvedValue('brand-new-token');

    const result = await ensureFreshAccessToken(staleToken, mockRefreshFn);

    expect(mockRefreshFn).toHaveBeenCalledTimes(1);
    expect(result).toBe('brand-new-token');
  });

  it('(2) exp 충분(>120s) → refreshFn 미호출, 원본 토큰 반환', async () => {
    const freshToken = makeJwt(3600); 
    const mockRefreshFn = jest.fn();

    const result = await ensureFreshAccessToken(freshToken, mockRefreshFn);

    expect(mockRefreshFn).not.toHaveBeenCalled();
    expect(result).toBe(freshToken);
  });

  it('(3) refresh null 반환 → 원본 토큰 반환 (throw 금지)', async () => {
    const staleToken = makeJwt(30); 
    const mockRefreshFn = jest.fn().mockResolvedValue(null);

    const result = await ensureFreshAccessToken(staleToken, mockRefreshFn);

    expect(mockRefreshFn).toHaveBeenCalledTimes(1);
    expect(result).toBe(staleToken);
  });

  it('(4) refresh throw → 원본 토큰 반환 (throw 금지)', async () => {
    const staleToken = makeJwt(30);
    const mockRefreshFn = jest.fn().mockRejectedValue(new Error('network_error'));

    const result = await ensureFreshAccessToken(staleToken, mockRefreshFn);

    expect(result).toBe(staleToken);
  });

  it('(5) 디코드 불가 토큰 → 원본 반환, refreshFn 미호출 (throw 금지)', async () => {
    const garbled = 'not.a.valid.jwt.at.all';
    const mockRefreshFn = jest.fn();

    const result = await ensureFreshAccessToken(garbled, mockRefreshFn);

    expect(result).toBe(garbled);
    expect(mockRefreshFn).not.toHaveBeenCalled();
  });

  it('(6) 빈 문자열 토큰 → 빈 문자열 반환, refreshFn 미호출 (throw 금지)', async () => {
    const mockRefreshFn = jest.fn();

    const result = await ensureFreshAccessToken('', mockRefreshFn);

    expect(result).toBe('');
    expect(mockRefreshFn).not.toHaveBeenCalled();
  });
});

describe('authFetch H-2: raw= 토큰 로그 가드', () => {
  it('raw= 출력이 __DEV__ 가드 블록 안에만 존재해야 한다', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../src/lib/authFetch.ts'),
      'utf-8',
    );
    const lines = src.split('\n');

    const rawLineIdxs = lines
      .map((l, i) => ({ i, l }))
      .filter(({ l }) => l.includes('"raw="') || l.includes("'raw='"));

    expect(rawLineIdxs.length).toBeGreaterThan(0); 

    for (const { i } of rawLineIdxs) {
      const context = lines.slice(Math.max(0, i - 20), i + 1).join('\n');
      expect(context).toMatch(/__DEV__/);
    }
  });
});
