

import { v_5c3059 } from "../api/clones";
import { v_7d2692 } from "../api/files";
import { v_1ed7d9 } from "../stores/authStore";
import { v_9139dc, type v_26f0b6 } from "./validatePersonaImage";

export interface PersonaImageCheckDeps {
  validate?: (uri: string) => Promise<v_26f0b6>;
  upload?: typeof v_7d2692;
  check?: typeof v_5c3059;
  getToken?: () => string | null | undefined;

  onServerCheckStart?: () => void;
}

export const v_5782dc = 30_000;

const NO_FACE: v_26f0b6 = { ok: false, reason: "no_face" };

export async function v_11fdee(
  v_cd1446,
  v_84b93d = {},
): Promise<v_26f0b6> {
  const v_3181cc = v_84b93d.validate ?? v_9139dc;
  const v_0f55b7 = v_84b93d.upload ?? v_7d2692;
  const v_de130a = v_84b93d.check ?? v_5c3059;
  const v_499b6e = v_84b93d.getToken ?? (() => v_1ed7d9.getState().accessToken);

  const v_c67510 = await v_3181cc(v_cd1446);
  if (v_c67510.ok || v_c67510.reason !== "no_face") return v_c67510;

  const v_21cc31 = v_499b6e();
  if (!v_21cc31) return v_c3e33d;
  let v_cb36b1;
  try {
    v_84b93d.onServerCheckStart?.();
    const v_bd02bc = (async (): Promise<v_26f0b6> => {
      const v_57ac81 = await v_0f55b7(v_21cc31, v_cd1446, { purpose: "clone_avatar" });
      const v_8f00b9 = await v_de130a(v_21cc31, { src_file_id: v_57ac81.id });
      return v_8f00b9.ok ? { ok: true } : v_c3e33d;
    })();
    v_bd02bc.catch(() => undefined); 
    const v_ea0359 = new Promise<v_26f0b6>((v_6f7712) => {
      v_cb36b1 = setTimeout(() => v_6f7712(v_c3e33d), v_5782dc);
    });
    return await Promise.race([v_bd02bc, v_ea0359]);
  } catch {
    return v_c3e33d;
  } finally {
    if (v_cb36b1) clearTimeout(v_cb36b1);
  }
}
