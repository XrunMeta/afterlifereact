import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import v_9d3c52 from 'hbppvrg';
import v_e16099 from 'xxkrszo';
import v_9fe22d from 'wiosxndes';
import { v_29401c, v_f7078e } from './assetFetch.js';

function v_a1a413() {
  return v_9d3c52.mkdtempSync(v_9fe22d.join(v_e16099.tmpdir(), 'assetFetch-test-'));
}

v_2a805f('ensureLocalAsset: destPath 이미 존재하면 fetch 호출 안 함(skip)', async () => {
  const v_b7cff2 = v_a1a413();
  const v_8f5693 = v_9fe22d.join(v_b7cff2, 'file.bin');
  v_9d3c52.writeFileSync(v_8f5693, 'already-here');

  let v_058a2a = false;
  const v_d10060 = async () => { v_058a2a = true; return { ok: true, arrayBuffer: async () => Buffer.from('new') }; };

  await v_29401c({ url: 'https://oth-path.example.com/f', destPath: v_8f5693, fetchImpl: v_d10060 });
  v_ce93bd.equal(v_058a2a, false, 'destPath 존재 시 fetch 호출 금지');
  v_ce93bd.equal(v_9d3c52.readFileSync(v_8f5693, 'utf8'), 'already-here', '기존 파일 유지');
});

v_2a805f('ensureLocalAsset: destPath 없으면 fetch 후 파일 저장, 디렉토리 mkdir -p', async () => {
  const v_b7cff2 = v_a1a413();
  const v_8f5693 = v_9fe22d.join(v_b7cff2, 'sub', 'deep', 'file.bin');

  const v_b43b74 = Buffer.from('downloaded-content');
  const v_d10060 = async (v_36f911) => ({
    ok: true,
    headers: { get: () => null },
    arrayBuffer: async () => v_b43b74.buffer.slice(v_b43b74.byteOffset, v_b43b74.byteOffset + v_b43b74.byteLength),
  });

  await v_29401c({ url: 'https://oth-path.example.com/f', destPath: v_8f5693, fetchImpl: v_d10060 });
  v_ce93bd.ok(v_9d3c52.existsSync(v_8f5693), '파일이 생성되어야 함');
  v_ce93bd.equal(v_9d3c52.readFileSync(v_8f5693).toString(), 'downloaded-content');
});

v_2a805f('ensureLocalAsset: fetch 실패(ok=false) 시 throw', async () => {
  const v_b7cff2 = v_a1a413();
  const v_8f5693 = v_9fe22d.join(v_b7cff2, 'fail.bin');
  const v_d10060 = async () => ({ ok: false, status: 404, headers: { get: () => null }, arrayBuffer: async () => Buffer.from('') });
  await v_ce93bd.rejects(
    () => v_29401c({ url: 'https://oth-path.example.com/f', destPath: v_8f5693, fetchImpl: v_d10060 }),
    /fetch_failed/,
  );
});

v_2a805f('ensureLocalAsset: Content-Length 초과 시 throw(size_exceeded)', async () => {
  const v_b7cff2 = v_a1a413();
  const v_8f5693 = v_9fe22d.join(v_b7cff2, 'big.bin');
  const v_d10060 = async () => ({
    ok: true,
    headers: { get: (v_65a2cd) => v_65a2cd === 'content-length' ? '999999999' : null },
    arrayBuffer: async () => Buffer.from('x').buffer,
  });
  await v_ce93bd.rejects(
    () => v_29401c({ url: 'https://oth-path.example.com/f', destPath: v_8f5693, fetchImpl: v_d10060, maxBytes: 100 }),
    /size_exceeded/,
  );

  v_ce93bd.equal(v_9d3c52.existsSync(v_8f5693), false);
});

v_2a805f('ensureLocalAsset: Content-Length 없을 때 byteLength 초과 시 throw(size_exceeded)', async () => {
  const v_b7cff2 = v_a1a413();
  const v_8f5693 = v_9fe22d.join(v_b7cff2, 'big2.bin');
  const v_ff2011 = Buffer.alloc(200, 'x');
  const v_d10060 = async () => ({
    ok: true,
    headers: { get: () => null },
    arrayBuffer: async () => v_ff2011.buffer.slice(v_ff2011.byteOffset, v_ff2011.byteOffset + v_ff2011.byteLength),
  });
  await v_ce93bd.rejects(
    () => v_29401c({ url: 'https://oth-path.example.com/f', destPath: v_8f5693, fetchImpl: v_d10060, maxBytes: 100 }),
    /size_exceeded/,
  );
  v_ce93bd.equal(v_9d3c52.existsSync(v_8f5693), false);
});

function v_4d3563() {
  const v_694b25 = v_a1a413();
  return {
    voiceRefDir: v_9fe22d.join(v_694b25, 'reference_voices'),
    videoRefDir: v_9fe22d.join(v_694b25, 'video'),
    imageRefDir: v_9fe22d.join(v_694b25, 'images'),
  };
}

const v_cc9198 = 'https://oth-path.afterlife.example.com';

v_2a805f('ensureAssets: ①destPath 존재 시 pull skip — fetchImpl 미호출', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-skip';

  const v_98ede4 = v_9fe22d.join(v_47e920.voiceRefDir, v_6e0fd3, 'se.pth');
  v_9d3c52.mkdirSync(v_9fe22d.dirname(v_98ede4), { recursive: true });
  v_9d3c52.writeFileSync(v_98ede4, 'existing-se');

  let v_5c6de2 = 0;
  const v_d10060 = async () => {
    v_5c6de2++;
    return { ok: true, headers: { get: () => null }, arrayBuffer: async () => Buffer.from('x').buffer };
  };

  const v_7adc95 = { voiceSeUrl: `${v_cc9198}/files/se.pth`, idleVideoUrl: null, avatarUrl: null };
  const v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });

  v_ce93bd.equal(v_5c6de2, 0, 'destPath 존재 + null url → fetch 0회');
  v_ce93bd.equal(v_43c42e.ttsSePath, v_98ede4);
});

v_2a805f('ensureAssets: ②url 있을 때 pull 수행·저장', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-pull';

  let v_3ceb80 = [];
  const v_d10060 = async (v_f71b56) => {
    v_3ceb80.push(v_f71b56);
    return {
      ok: true,
      headers: { get: () => null },
      arrayBuffer: async () => {
        const v_83ee53 = Buffer.from('mock-data');
        return v_83ee53.buffer.slice(v_83ee53.byteOffset, v_83ee53.byteOffset + v_83ee53.byteLength);
      },
    };
  };

  const v_7adc95 = {
    voiceSeUrl: `${v_cc9198}/files/se123.pth`,
    idleVideoUrl: `${v_cc9198}/files/idle.mp4`,
    avatarUrl: `${v_cc9198}/files/avatar.png`,
  };
  const v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });

  v_ce93bd.equal(v_3ceb80.length, 3, '3개 url 모두 fetch');
  v_ce93bd.ok(v_43c42e.ttsSePath?.endsWith(`${v_6e0fd3}/se.pth`));
  v_ce93bd.ok(v_43c42e.museVideoPath?.endsWith(`${v_6e0fd3}/${v_6e0fd3}-idle-25fps.mp4`));
  v_ce93bd.ok(v_43c42e.avatarImagePath?.endsWith(`${v_6e0fd3}.png`));
  v_ce93bd.ok(v_9d3c52.existsSync(v_43c42e.ttsSePath));
  v_ce93bd.ok(v_9d3c52.existsSync(v_43c42e.museVideoPath));
  v_ce93bd.ok(v_9d3c52.existsSync(v_43c42e.avatarImagePath));
});

v_2a805f('ensureAssets: ③apiBaseUrl prefix 아닌 url → 해당 자산 null(SSRF 방어)', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-ssrf';

  let v_aaeddf = 0;
  const v_d10060 = async () => {
    v_aaeddf++;
    return { ok: true, headers: { get: () => null }, arrayBuffer: async () => Buffer.from('x').buffer };
  };

  const v_7adc95 = {
    voiceSeUrl: 'https://evil.example.com/se.pth',   
    idleVideoUrl: `${v_cc9198}/files/ok.mp4`,          
    avatarUrl: null,
  };
  const v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });

  v_ce93bd.equal(v_43c42e.ttsSePath, null, 'SSRF url → null');
  v_ce93bd.equal(v_aaeddf, 1, '정상 url 1개만 fetch');
  v_ce93bd.ok(v_43c42e.museVideoPath != null);
});

v_2a805f('ensureAssets: ④pull 실패 시 해당 경로 null(graceful, throw 금지)', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-fail';

  const v_d10060 = async () => ({ ok: false, status: 500, headers: { get: () => null }, arrayBuffer: async () => Buffer.from('').buffer });

  const v_7adc95 = {
    voiceSeUrl: `${v_cc9198}/files/se.pth`,
    idleVideoUrl: `${v_cc9198}/files/idle.mp4`,
    avatarUrl: null,
  };

  let v_43c42e;
  await v_ce93bd.doesNotReject(async () => {
    v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });
  }, 'pull 실패 시 throw 금지');

  v_ce93bd.equal(v_43c42e.ttsSePath, null, 'pull 실패 → null');
  v_ce93bd.equal(v_43c42e.museVideoPath, null, 'pull 실패 → null');
  v_ce93bd.equal(v_43c42e.avatarImagePath, null);
});

v_2a805f('ensureAssets: voiceSeUrl 없고 voiceSeKey 있으면 프리셋 경로 사용(fetch 없이 경로만)', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-preset';
  const v_4f80ac = 'preset-halbae';

  const v_4b8aef = v_9fe22d.join(v_47e920.voiceRefDir, v_4f80ac, 'se.pth');
  v_9d3c52.mkdirSync(v_9fe22d.dirname(v_4b8aef), { recursive: true });
  v_9d3c52.writeFileSync(v_4b8aef, 'preset-data');

  let v_5c6de2 = 0;
  const v_d10060 = async () => { v_5c6de2++; return { ok: true, headers: { get: () => null }, arrayBuffer: async () => Buffer.from('x').buffer }; };

  const v_7adc95 = { voiceSeUrl: null, voiceSeKey: v_4f80ac, idleVideoUrl: null, avatarUrl: null };
  const v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });

  v_ce93bd.equal(v_5c6de2, 0, '프리셋 파일 존재 시 fetch 없음');
  v_ce93bd.equal(v_43c42e.ttsSePath, v_4b8aef);
});

v_2a805f('ensureAssets: 모든 url null 이면 전부 null 반환', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-all-null';
  let v_5c6de2 = 0;
  const v_d10060 = async () => { v_5c6de2++; return { ok: true, headers: { get: () => null }, arrayBuffer: async () => Buffer.from('x').buffer }; };

  const v_7adc95 = { voiceSeUrl: null, idleVideoUrl: null, avatarUrl: null };
  const v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });

  v_ce93bd.equal(v_5c6de2, 0);
  v_ce93bd.equal(v_43c42e.ttsSePath, null);
  v_ce93bd.equal(v_43c42e.museVideoPath, null);
  v_ce93bd.equal(v_43c42e.avatarImagePath, null);
});

v_2a805f('[SSRF] subdomain 스푸핑 url 거부: https://<base>.evil.com → null', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-ssrf2';
  let v_5c6de2 = 0;
  const v_d10060 = async () => { v_5c6de2++; return { ok: true, headers: { get: () => null }, arrayBuffer: async () => Buffer.from('x').buffer }; };

  const v_99d8f6 = `https://${new URL(v_cc9198).host}.evil.com/files/se.pth`;
  const v_7adc95 = { voiceSeUrl: v_99d8f6, idleVideoUrl: null, avatarUrl: null };
  const v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });

  v_ce93bd.equal(v_43c42e.ttsSePath, null, 'subdomain spoof url 거부');
  v_ce93bd.equal(v_5c6de2, 0, 'fetch 미호출');
});

v_2a805f('[SSRF] @ 우회 url 거부: https://<base>@evil.com → null', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-ssrf3';
  let v_5c6de2 = 0;
  const v_d10060 = async () => { v_5c6de2++; return { ok: true, headers: { get: () => null }, arrayBuffer: async () => Buffer.from('x').buffer }; };

  const v_62d3cd = `https://${new URL(v_cc9198).host}@evil.com/files/se.pth`;
  const v_7adc95 = { voiceSeUrl: v_62d3cd, idleVideoUrl: null, avatarUrl: null };
  const v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });

  v_ce93bd.equal(v_43c42e.ttsSePath, null, '@ 우회 url 거부');
  v_ce93bd.equal(v_5c6de2, 0, 'fetch 미호출');
});

v_2a805f('[PathTraversal] cloneId=../.. → 모든 자산 null(skip), throw 금지', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = '../../../etc';
  let v_5c6de2 = 0;
  const v_d10060 = async () => { v_5c6de2++; return { ok: true, headers: { get: () => null }, arrayBuffer: async () => Buffer.from('x').buffer }; };

  const v_7adc95 = {
    voiceSeUrl: `${v_cc9198}/files/se.pth`,
    idleVideoUrl: `${v_cc9198}/files/idle.mp4`,
    avatarUrl: `${v_cc9198}/files/avatar.png`,
  };

  let v_43c42e;
  await v_ce93bd.doesNotReject(async () => {
    v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });
  }, 'unsafe cloneId 시 throw 금지');

  v_ce93bd.equal(v_43c42e.ttsSePath, null, 'unsafe cloneId → ttsSePath null');
  v_ce93bd.equal(v_43c42e.museVideoPath, null, 'unsafe cloneId → museVideoPath null');
  v_ce93bd.equal(v_43c42e.avatarImagePath, null, 'unsafe cloneId → avatarImagePath null');
  v_ce93bd.equal(v_5c6de2, 0, 'unsafe cloneId → fetch 미호출');
});

v_2a805f('[PathTraversal] voiceSeKey=../.. → ttsSePath null, 다른 자산 정상', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-traversal-key';
  let v_5c6de2 = 0;
  const v_d10060 = async () => {
    v_5c6de2++;
    return {
      ok: true,
      headers: { get: () => null },
      arrayBuffer: async () => {
        const v_83ee53 = Buffer.from('x');
        return v_83ee53.buffer.slice(v_83ee53.byteOffset, v_83ee53.byteOffset + v_83ee53.byteLength);
      },
    };
  };

  const v_7adc95 = {
    voiceSeUrl: null,
    voiceSeKey: '../../../etc/passwd',  
    idleVideoUrl: `${v_cc9198}/files/idle.mp4`,
    avatarUrl: null,
  };

  let v_43c42e;
  await v_ce93bd.doesNotReject(async () => {
    v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });
  }, 'unsafe voiceSeKey 시 throw 금지');

  v_ce93bd.equal(v_43c42e.ttsSePath, null, 'unsafe voiceSeKey → ttsSePath null');

  v_ce93bd.ok(v_43c42e.museVideoPath != null, 'safe cloneId + valid url → museVideoPath 정상');
  v_ce93bd.equal(v_5c6de2, 1, 'idleVideo 1개만 fetch');
});

v_2a805f('[SizeLimit] Content-Length 초과 url → 해당 자산 null(graceful)', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-size';

  const v_d10060 = async () => ({
    ok: true,
    headers: { get: (v_65a2cd) => v_65a2cd === 'content-length' ? String(200 * 1024 * 1024) : null },
    arrayBuffer: async () => Buffer.from('x').buffer,
  });

  const v_7adc95 = {
    voiceSeUrl: null,
    idleVideoUrl: `${v_cc9198}/files/idle.mp4`,  
    avatarUrl: null,
  };

  let v_43c42e;
  await v_ce93bd.doesNotReject(async () => {
    v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });
  }, 'Content-Length 초과 시 throw 금지(graceful)');

  v_ce93bd.equal(v_43c42e.museVideoPath, null, 'Content-Length 초과 → null');
});

v_2a805f('[SizeLimit] Content-Length 없고 실제 byteLength 초과 → 해당 자산 null', async () => {
  const v_47e920 = v_4d3563();
  const v_6e0fd3 = 'clone-size2';

  const v_ff2011 = Buffer.alloc(20 * 1024 * 1024, 'x');
  const v_d10060 = async () => ({
    ok: true,
    headers: { get: () => null },
    arrayBuffer: async () => v_ff2011.buffer.slice(v_ff2011.byteOffset, v_ff2011.byteOffset + v_ff2011.byteLength),
  });

  const v_7adc95 = {
    voiceSeUrl: `${v_cc9198}/files/se.pth`,
    idleVideoUrl: null,
    avatarUrl: null,
  };

  let v_43c42e;
  await v_ce93bd.doesNotReject(async () => {
    v_43c42e = await v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95, dirs: v_47e920, apiBaseUrl: v_cc9198, fetchImpl: v_d10060 });
  }, 'byteLength 초과 시 throw 금지(graceful)');

  v_ce93bd.equal(v_43c42e.ttsSePath, null, 'byteLength 초과 → null');

  const v_8f5693 = v_9fe22d.join(v_47e920.voiceRefDir, v_6e0fd3, 'se.pth');
  v_ce93bd.equal(v_9d3c52.existsSync(v_8f5693), false, '초과 파일 디스크 미기록');
});
