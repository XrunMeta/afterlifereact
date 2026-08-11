

import type { v_8a6b56, v_71bfaa } from "../config/faceDiag";

export const v_70cd73 = 6;

export const v_815431 = 2500;

export interface FaceTrackMatch {
  personId: number | null;
  displayName: string | null;
  score: number;
  verdict: v_71bfaa;
  streak: number;
}

export interface FaceTrackEntry {

  trackingId: number;

  label: number;
  firstSeenMs: number;
  lastSeenMs: number;

  seenCount: number;

  match: FaceTrackMatch | null;
}

export interface FaceRosterState {

  entries: FaceTrackEntry[];

  nextLabel: number;

  lastDiag: v_8a6b56 | null;
  lastDiagAtMs: number;
}

export function v_6e2c23(): FaceRosterState {
  return { entries: [], nextLabel: 1, lastDiag: null, lastDiagAtMs: 0 };
}

export function v_99b411(
  v_b6e533,
  v_3e0537,
  v_67e77e,
): FaceRosterState {
  const v_52e08b = [];
  for (const v_389afb of v_3e0537) {
    if (typeof v_389afb !== "number" || !Number.isFinite(v_389afb)) continue;
    if (!v_52e08b.includes(v_389afb)) v_52e08b.push(v_389afb); 
  }
  if (v_52e08b.length === 0) return v_b6e533;

  let v_1e6eca = v_b6e533.entries;
  let v_2cf46e = v_b6e533.nextLabel;
  let v_40eb63 = false;

  for (const v_389afb of v_52e08b) {
    const v_e86ad8 = v_1e6eca.findIndex((v_9e86fd) => v_9e86fd.trackingId === v_389afb);
    if (v_e86ad8 >= 0) {
      const v_ba2215 = v_1e6eca[v_e86ad8];
      const v_a448ad = {
        ...v_ba2215,
        lastSeenMs: v_67e77e,
        seenCount: v_ba2215.seenCount + 1,
      };
      v_1e6eca = v_40eb63 ? v_1e6eca : v_1e6eca.slice();
      v_1e6eca[v_e86ad8] = v_a448ad;
      v_40eb63 = true;
    } else {
      v_1e6eca = v_40eb63 ? v_1e6eca : v_1e6eca.slice();
      v_1e6eca.push({
        trackingId: v_389afb,
        label: v_2cf46e,
        firstSeenMs: v_67e77e,
        lastSeenMs: v_67e77e,
        seenCount: 1,
        match: null,
      });
      v_2cf46e += 1;
      v_40eb63 = true;
    }
  }

  if (v_1e6eca.length > v_70cd73) {

    const v_eedcf1 = v_1e6eca
      .slice()
      .sort((v_779914, v_148ff6) => v_779914.lastSeenMs - v_148ff6.lastSeenMs)
      .slice(0, v_1e6eca.length - v_70cd73)
      .map((v_9e86fd) => v_9e86fd.trackingId);
    v_1e6eca = v_1e6eca.filter((v_9e86fd) => !v_eedcf1.includes(v_9e86fd.trackingId));
  }

  return { ...v_b6e533, entries: v_1e6eca, nextLabel: v_2cf46e };
}

export function v_772beb(v_2b8338, v_67e77e): boolean {
  return v_67e77e - v_2b8338.lastSeenMs <= v_815431;
}

export function v_40137b(
  v_b6e533,
  diag: v_8a6b56 | null,
  v_67e77e,
): FaceRosterState {
  if (v_ef2205 == null) {
    if (v_b6e533.lastDiag == null) return v_b6e533;
    return { ...v_b6e533, lastDiag: null };
  }
  const v_20dfdc = v_b6e533.entries
    .map((v_9e86fd, v_ebec57) => (v_772beb(v_9e86fd, v_67e77e) ? v_ebec57 : -1))
    .filter((v_ebec57) => v_ebec57 >= 0);

  let v_1e6eca = v_b6e533.entries;
  if (v_20dfdc.length === 1) {
    const v_ebec57 = v_20dfdc[0];
    v_1e6eca = v_1e6eca.slice();
    v_1e6eca[v_ebec57] = {
      ...v_1e6eca[v_ebec57],
      match: {
        personId: v_ef2205.personId,
        displayName: v_ef2205.displayName,
        score: v_ef2205.score,
        verdict: v_ef2205.verdict,
        streak: v_ef2205.streak,
      },
    };
  }
  return { ...v_b6e533, entries: v_1e6eca, lastDiag: v_ef2205, lastDiagAtMs: v_67e77e };
}

export function v_204d2e(v_2b8338, v_f8b770): string {
  const v_43fb07 = `${v_f8b770 ? "*" : " "} 얼굴${v_2b8338.label} id:${v_2b8338.trackingId}`;
  if (v_2b8338.match == null) return `${v_43fb07} -`;
  const v_35f85c = v_2b8338.match;
  const v_97d2e9 = v_35f85c.displayName ?? (v_35f85c.personId != null ? `#${v_35f85c.personId}` : "?");
  const v_1b0e1d = v_35f85c.verdict.slice(0, 4); 
  return `${v_43fb07} ${v_97d2e9} ${v_35f85c.score.toFixed(2)} ${v_1b0e1d} ${v_35f85c.streak}/3`;
}
