

export interface StageSignal {

  stage: string;

  seq: number | null;

  tMs: number | null;

  info: string;
}

const v_606f10 = 24;

const v_1f9dd5 = 4;
const v_613ab7 = 12;

const v_a5a362 = {
  chars: 'chars',
  audio_ms: 'audio',
  frames: 'frames',
  queued_ms: 'queued',
};

const v_e76aeb = (v_81e2ef, v_d2c6bf): string => (v_81e2ef.length <= v_d2c6bf ? v_81e2ef : `${v_81e2ef.slice(0, v_d2c6bf)}…`);

export function v_74707b(v_3cfdfc): string {
  if (!v_3cfdfc || typeof v_3cfdfc !== 'object' || Array.isArray(v_3cfdfc)) return '';
  const v_8d4337 = [];
  for (const [v_0eb677, v_479f05] of Object.entries(v_3cfdfc as Record<string, unknown>)) {
    if (v_8d4337.length >= v_1f9dd5) break;
    let v_81e2ef;
    if (typeof v_479f05 === 'number') v_81e2ef = Number.isFinite(v_479f05) ? String(Math.round(v_479f05)) : '';
    else if (typeof v_479f05 === 'string') v_81e2ef = v_e76aeb(v_479f05, v_613ab7);
    else if (typeof v_479f05 === 'boolean') v_81e2ef = v_479f05 ? 'Y' : 'N';
    else continue; 
    if (!v_81e2ef) continue;
    v_8d4337.push(`${v_a5a362[v_0eb677] ?? v_e76aeb(v_0eb677, v_613ab7)}:${v_81e2ef}`);
  }
  return v_8d4337.join(' ');
}

export function v_82da3f(v_35f85c): StageSignal | null {
  if (!v_35f85c || typeof v_35f85c !== 'object') return null;
  const v_b6c474 = v_35f85c as Record<string, unknown>;
  const v_162c49 = v_b6c474.stage;
  if (typeof v_162c49 !== 'string' || !v_162c49) return null;
  return {
    stage: v_e76aeb(v_162c49, v_606f10),
    seq: typeof v_b6c474.seq === 'number' && Number.isFinite(v_b6c474.seq) ? v_b6c474.seq : null,
    tMs: typeof v_b6c474.tMs === 'number' && Number.isFinite(v_b6c474.tMs) ? Math.round(v_b6c474.tMs) : null,
    info: v_74707b(v_b6c474.detail),
  };
}
