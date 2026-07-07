

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
