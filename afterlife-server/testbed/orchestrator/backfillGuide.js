

export function v_1d1f8f(v_18b8bf) {
  return (v_18b8bf || []).filter(
    (v_3f4e2e) => (v_3f4e2e.guide_video_urls == null) && v_3f4e2e.voice_raw_url != null && String(v_3f4e2e.voice_raw_url).trim(),
  );
}

export async function v_581729({ fetchClones: v_894788, createGuideJob: v_40ffd7, log: v_3e58a1 = console.log }) {
  const v_18b8bf = await v_894788();
  const v_f425f6 = v_1d1f8f(v_18b8bf);
  v_3e58a1(`[backfill-guide] ${v_f425f6.length}/${v_18b8bf.length} 대상`);
  let v_3ed4c3 = 0;
  for (const v_3f4e2e of v_f425f6) {
    try { await v_40ffd7(v_3f4e2e); v_3ed4c3++; }
    catch (v_9e86fd) { v_3e58a1(`[backfill-guide] clone ${v_3f4e2e.id} 실패: ${v_9e86fd.message}`); }
  }
  v_3e58a1(`[backfill-guide] 완료 ${v_3ed4c3}/${v_f425f6.length}`);
  return { total: v_18b8bf.length, targeted: v_f425f6.length, created: v_3ed4c3 };
}

export function v_586f14(v_3ac7e7, v_6cdec8) {
  return {
    id: v_3ac7e7.id,
    guide_video_urls: null,
    voice_raw_url: v_3ac7e7.voice_src_file_id != null ? `${v_6cdec8}/oth-path${v_3ac7e7.voice_src_file_id}` : null,
  };
}

export function v_2781e7({ apiBase: v_6cdec8, devSecret: v_100d3c, fetchImpl: v_d10060 = fetch }) {
  return async function v_894788() {
    const v_8f00b9 = await v_d10060(`${v_6cdec8}/oth-path`, {
      headers: { Authorization: `Bearer ${v_100d3c}` },
    });
    if (!v_8f00b9.ok) {
      throw new Error(`guide-backfill-targets 조회 실패: ${v_8f00b9.status}`);
    }
    const v_4d33b2 = await v_8f00b9.json();
    return (v_4d33b2.data || []).map((v_3ac7e7) => v_586f14(v_3ac7e7, v_6cdec8));
  };
}

export function v_2368e2({ apiBase: v_6cdec8, devSecret: v_100d3c, fetchImpl: v_d10060 = fetch }) {
  return async function v_40ffd7(v_eb25ce) {
    const v_8f00b9 = await v_d10060(`${v_6cdec8}/oth-path${v_eb25ce.id}/guide-job`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_100d3c}` },
    });
    if (!v_8f00b9.ok) {
      const v_4d33b2 = await v_8f00b9.text().catch(() => "");
      throw new Error(`guide-job 트리거 실패(clone ${v_eb25ce.id}): ${v_8f00b9.status} ${v_4d33b2}`);
    }
    return v_8f00b9.json();
  };
}

async function v_10bff5() {
  const v_6cdec8 = process.env.API_BASE;
  const v_100d3c = process.env.DEV_SECRET;
  if (!v_6cdec8 || !v_100d3c) {
    console.error("[backfill-guide] API_BASE / DEV_SECRET 환경변수가 필요합니다.");
    process.exitCode = 1;
    return;
  }
  const v_894788 = v_2781e7({ apiBase: v_6cdec8, devSecret: v_100d3c });
  const v_40ffd7 = v_2368e2({ apiBase: v_6cdec8, devSecret: v_100d3c });
  const v_43c42e = await v_581729({ fetchClones: v_894788, createGuideJob: v_40ffd7 });
  console.log("[backfill-guide] result:", JSON.stringify(v_43c42e));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  v_10bff5().catch((v_9e86fd) => {
    console.error("[backfill-guide] 치명적 실패:", v_9e86fd.message);
    process.exitCode = 1;
  });
}
