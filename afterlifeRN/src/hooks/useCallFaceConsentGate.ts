

import { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import {
  v_71ae8a,
  v_0f8436,
  v_505b50,
  v_421733,
} from "../api/consent";

const v_6534cf = "@afterlifeRN/callFaceConsent/snoozedAt";
const v_40c236 = 24 * 60 * 60 * 1000;

export type CallFaceConsentGate = "checking" | "prompt" | "ok";

export function v_30dc36(v_2ca7e0) {
  const [v_98ce98, v_dbebef] = v_5ab095<CallFaceConsentGate>("checking");
  const [v_5cd3f8, v_e861b7] = v_5ab095(false);
  const [v_53be30, v_0a45dd] = v_5ab095(false);

  v_c4deb2(() => {
    if (!v_2ca7e0) {
      v_dbebef("ok");
      return;
    }
    let v_2008a4 = false;
    let v_8a167a = false;
    const v_cb36b1 = setTimeout(() => {
      v_8a167a = true;
      console.warn("[Call][faceConsentGate] timeout → ok");
      if (!v_2008a4) v_dbebef("ok");
    }, 2000);

    (async () => {
      try {
        const v_abc428 = Number(await v_e84827.getItem(v_6534cf).catch(() => null));
        if (Number.isFinite(v_abc428) && v_abc428 > 0 && Date.now() - v_abc428 < v_40c236) {
          clearTimeout(v_cb36b1);
          if (!v_2008a4) v_dbebef("ok");
          return;
        }
        const [v_7d769d, v_a9fdcc] = await Promise.all([
          v_0f8436(v_2ca7e0).catch(() => null),
          v_71ae8a(v_2ca7e0).catch(() => null),
        ]);
        if (v_2008a4 || v_8a167a) return;
        clearTimeout(v_cb36b1);

        const v_899aa2 = v_7d769d !== null && v_7d769d.state !== "granted";
        const v_da4d07 = v_a9fdcc !== null && v_a9fdcc !== "granted";
        console.log(`[Call][faceConsentGate] face=${v_7d769d?.state ?? "?"} cloneFace=${v_a9fdcc ?? "?"}`);
        v_e861b7(v_899aa2);
        v_0a45dd(v_da4d07);
        v_dbebef(v_899aa2 || v_da4d07 ? "prompt" : "ok");
      } catch (v_49263d) {
        if (v_2008a4 || v_8a167a) return;
        clearTimeout(v_cb36b1);
        console.warn("[Call][faceConsentGate] error → ok:", v_49263d);
        v_dbebef("ok");
      }
    })();

    return () => {
      v_2008a4 = true;
      clearTimeout(v_cb36b1);
    };
  }, [v_2ca7e0]);

  const v_a6fcf8 = v_de06a3(
    async (v_c7afb2, v_4513fd) => {
      if (v_2ca7e0) {
        const v_ea7071 = [];
        if (v_5cd3f8 && v_c7afb2) {
          v_ea7071.push(
            v_421733(v_2ca7e0, "granted", { termsVersion: "v1", channel: "call_prompt" })
              .catch((v_49263d) => console.warn("[Call][faceConsentGate] saveFaceBiometric failed:", v_49263d)),
          );
        }
        if (v_53be30 && v_4513fd) {
          v_ea7071.push(
            v_505b50(v_2ca7e0, "granted", { termsVersion: "v1", channel: "call_prompt" })
              .catch((v_49263d) => console.warn("[Call][faceConsentGate] saveCloneFace failed:", v_49263d)),
          );
        }
        await Promise.all(v_ea7071);
      }
      const v_3128a7 = (v_5cd3f8 && !v_c7afb2) || (v_53be30 && !v_4513fd);
      if (v_3128a7) await v_e84827.setItem(v_6534cf, String(Date.now())).catch(() => {});
      v_dbebef("ok");
    },
    [v_2ca7e0, v_5cd3f8, v_53be30],
  );

  const v_5df3e0 = v_de06a3(async () => {
    await v_e84827.setItem(v_6534cf, String(Date.now())).catch(() => {});
    v_dbebef("ok");
  }, []);

  return { gate: v_98ce98, needFace: v_5cd3f8, needCloneFace: v_53be30, agree: v_a6fcf8, cancel: v_5df3e0 };
}
