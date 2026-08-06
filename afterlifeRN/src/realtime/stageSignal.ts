

export interface StageSignal {

  stage: string;

  seq: number | null;

  tMs: number | null;

  info: string;
}

const STAGE_NAME_MAX = 24;

const DETAIL_KEYS_MAX = 4;
const DETAIL_VALUE_MAX = 12;

const DETAIL_LABEL: Record<string, string> = {
  chars: 'chars',
  audio_ms: 'audio',
  frames: 'frames',
  queued_ms: 'queued',
};

const clip = (v: string, max: number): string => (v.length <= max ? v : `${v.slice(0, max)}…`);

export function formatStageDetail(detail: unknown): string {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return '';
  const out: string[] = [];
  for (const [k, raw] of Object.entries(detail as Record<string, unknown>)) {
    if (out.length >= DETAIL_KEYS_MAX) break;
    let v: string;
    if (typeof raw === 'number') v = Number.isFinite(raw) ? String(Math.round(raw)) : '';
    else if (typeof raw === 'string') v = clip(raw, DETAIL_VALUE_MAX);
    else if (typeof raw === 'boolean') v = raw ? 'Y' : 'N';
    else continue; 
    if (!v) continue;
    out.push(`${DETAIL_LABEL[k] ?? clip(k, DETAIL_VALUE_MAX)}:${v}`);
  }
  return out.join(' ');
}

export function parseStageMessage(m: unknown): StageSignal | null {
  if (!m || typeof m !== 'object') return null;
  const o = m as Record<string, unknown>;
  const rawName = o.stage;
  if (typeof rawName !== 'string' || !rawName) return null;
  return {
    stage: clip(rawName, STAGE_NAME_MAX),
    seq: typeof o.seq === 'number' && Number.isFinite(o.seq) ? o.seq : null,
    tMs: typeof o.tMs === 'number' && Number.isFinite(o.tMs) ? Math.round(o.tMs) : null,
    info: formatStageDetail(o.detail),
  };
}
