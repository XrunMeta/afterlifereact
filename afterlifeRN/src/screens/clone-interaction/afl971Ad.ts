

export interface AdCadence {
  firstRound: number;
  interval: number;
}

export const v_5565ed = { firstRound: 11, interval: 5 };

export function v_8e0f80(v_5a1787, v_303197 = v_5565ed): boolean {
  const v_3e45d6 = v_303197?.firstRound;
  const v_364721 = v_303197?.interval;
  if (!Number.isInteger(v_3e45d6) || v_3e45d6 < 1) return false;
  if (!Number.isInteger(v_364721) || v_364721 < 1) return false;
  return v_5a1787 === v_3e45d6 || (v_5a1787 > v_3e45d6 && (v_5a1787 - v_3e45d6) % v_364721 === 0);
}

export function v_1fb900(v_479f05): AdCadence {
  if (!v_479f05 || typeof v_479f05 !== "object") return v_5565ed;
  const v_e2a85c = v_479f05 as Partial<AdCadence>;
  const v_e84077 = Number(v_e2a85c.firstRound);
  const v_f9f313 = Number(v_e2a85c.interval);
  return {
    firstRound: Number.isInteger(v_e84077) && v_e84077 >= 1 && v_e84077 <= 1000 ? v_e84077 : v_5565ed.firstRound,
    interval: Number.isInteger(v_f9f313) && v_f9f313 >= 1 && v_f9f313 <= 1000 ? v_f9f313 : v_5565ed.interval,
  };
}

const v_9474af = new Set<string>([
  "oth-user@example.invalid",
  "oth-test@example.invalid",
]);
export function v_25c9bd(v_e0c7e8): boolean {
  if (!v_e0c7e8) return false;
  return v_9474af.has(v_e0c7e8.trim().toLowerCase());
}

export function v_1c04ac(v_328259): boolean {
  if (v_328259.pendingRound === null || v_328259.pendingRound === undefined) return false;
  if (v_328259.faceBusy) return false;
  if (v_328259.adInProgress) return false;
  return true;
}

export function v_7841ab(v_328259): boolean {
  return v_328259.appActive && v_328259.live;
}
