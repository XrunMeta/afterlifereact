

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
