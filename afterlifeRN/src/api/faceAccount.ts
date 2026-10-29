

import { v_04b58a } from "../lib/authFetch";

export type AccountFaceStep = "left" | "right" | "up" | "down";

export interface AccountFaceStatus {
  enabled: boolean;
  faceStatus?: "none" | "active" | "held";
  hold?: { active: boolean; reasons: string[] };
}

export async function v_31ecf2(v_2ca7e0): Promise<AccountFaceStatus> {
  const v_cb35cb = await v_04b58a<{ ok: true; data: AccountFaceStatus | null }>("/oth-path", v_2ca7e0, {
    method: "GET",
  });
  return v_cb35cb.data ?? { enabled: false };
}

export async function v_d24cb4(
  v_2ca7e0,
): Promise<{ challengeId: string; steps: AccountFaceStep[]; expiresAt: string }> {
  const v_cb35cb = await v_04b58a<{ ok: true; data: { challengeId: string; steps: AccountFaceStep[]; expiresAt: string } }>(
    "/oth-path",
    v_2ca7e0,
    { method: "POST" },
  );
  return v_cb35cb.data;
}

export async function v_62d015(
  v_2ca7e0,
  v_d789aa,
  v_8f4582,
  v_04e790,
): Promise<{ ok: boolean; faceStatus: string; held: boolean }> {
  const v_ebd523 = new FormData();
  v_ebd523.append("challengeId", v_d789aa);
  v_ebd523.append("source", v_04e790);
  v_8f4582.forEach((v_cd1446, v_ebec57) => {
    v_ebd523.append("frames", { uri: v_cd1446, name: `f${v_ebec57}.jpg`, type: "image/jpeg" } as unknown as Blob);
  });
  const v_cb35cb = await v_04b58a<{ ok: true; data: { ok: boolean; faceStatus: string; held: boolean } }>(
    "/oth-path",
    v_2ca7e0,
    { method: "POST", body: v_ebd523 },
    undefined,
    { multipart: true },
  );
  return v_cb35cb.data;
}
