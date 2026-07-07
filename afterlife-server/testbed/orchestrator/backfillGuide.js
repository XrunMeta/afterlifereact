

export function selectBackfillTargets(rows) {
  return (rows || []).filter(
    (c) => (c.guide_video_urls == null) && c.voice_raw_url != null && String(c.voice_raw_url).trim(),
  );
}

export async function runBackfill({ fetchClones, createGuideJob, log = console.log }) {
  const rows = await fetchClones();
  const targets = selectBackfillTargets(rows);
  log(`[backfill-guide] ${targets.length}/${rows.length} 대상`);
  let ok = 0;
  for (const c of targets) {
    try { await createGuideJob(c); ok++; }
    catch (e) { log(`[backfill-guide] clone ${c.id} 실패: ${e.message}`); }
  }
  log(`[backfill-guide] 완료 ${ok}/${targets.length}`);
  return { total: rows.length, targeted: targets.length, created: ok };
}

export function mapTargetRow(row, apiBase) {
  return {
    id: row.id,
    guide_video_urls: null,
    voice_raw_url: row.voice_src_file_id != null ? `${apiBase}/oth-path${row.voice_src_file_id}` : null,
  };
}

export function makeFetchClones({ apiBase, devSecret, fetchImpl = fetch }) {
  return async function fetchClones() {
    const res = await fetchImpl(`${apiBase}/oth-path`, {
      headers: { Authorization: `Bearer ${devSecret}` },
    });
    if (!res.ok) {
      throw new Error(`guide-backfill-targets 조회 실패: ${res.status}`);
    }
    const body = await res.json();
    return (body.data || []).map((row) => mapTargetRow(row, apiBase));
  };
}

export function makeCreateGuideJob({ apiBase, devSecret, fetchImpl = fetch }) {
  return async function createGuideJob(clone) {
    const res = await fetchImpl(`${apiBase}/oth-path${clone.id}/guide-job`, {
      method: "POST",
      headers: { Authorization: `Bearer ${devSecret}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`guide-job 트리거 실패(clone ${clone.id}): ${res.status} ${body}`);
    }
    return res.json();
  };
}

async function main() {
  const apiBase = process.env.API_BASE;
  const devSecret = process.env.DEV_SECRET;
  if (!apiBase || !devSecret) {
    console.error("[backfill-guide] API_BASE / DEV_SECRET 환경변수가 필요합니다.");
    process.exitCode = 1;
    return;
  }
  const fetchClones = makeFetchClones({ apiBase, devSecret });
  const createGuideJob = makeCreateGuideJob({ apiBase, devSecret });
  const result = await runBackfill({ fetchClones, createGuideJob });
  console.log("[backfill-guide] result:", JSON.stringify(result));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("[backfill-guide] 치명적 실패:", e.message);
    process.exitCode = 1;
  });
}
