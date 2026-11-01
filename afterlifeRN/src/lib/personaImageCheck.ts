

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
  try {
    v_84b93d.onServerCheckStart?.();
    const v_57ac81 = await v_0f55b7(v_21cc31, v_cd1446, { purpose: "clone_avatar" });
    const v_8f00b9 = await v_de130a(v_21cc31, { src_file_id: v_57ac81.id });
    return v_8f00b9.ok ? { ok: true } : v_c3e33d;
  } catch {
    return v_c3e33d;
  }
}
