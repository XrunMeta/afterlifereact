

import { v_326be8 } from "rcmrninabrnb";
import {
  v_84436a,
  v_ea1c3d,
  v_43431d,
  v_2218dc,
  v_a5059e,
  v_475e07,
  v_ae7770,
  type v_678322,
  type v_23b84c,
  type v_a60d00,
  type v_b57693,
} from "bvpcozhmvsrfxgke";
import { v_bb6abc } from "../api/credits";
import { v_1ed7d9 } from "../stores/authStore";

export const v_ca8f48 = [
  "run.xrun.afterlife.sub.light",
  "run.xrun.afterlife.sub.basic.v3",
  "run.xrun.afterlife.sub.standard",
  "run.xrun.afterlife.sub.plus",
  "run.xrun.afterlife.sub.premium",
] as const;

export const v_a43d0e = [
  "run.xrun.afterlife.credit.30",
  "run.xrun.afterlife.credit.60",
  "run.xrun.afterlife.credit.150",
  "run.xrun.afterlife.credit.300",

  "credits_1000",
] as const;

export type SubscriptionSku = (typeof v_ca8f48)[number];
export type ConsumableSku = (typeof v_a43d0e)[number];

let v_c9f274 = false;

export async function v_2f3103(): Promise<void> {
  if (v_c9f274) return;
  try {
    await v_84436a();
    v_c9f274 = true;
    console.log("[iap] initConnection ok");
  } catch (v_49263d) {
    console.warn("[iap] initConnection failed:", v_49263d);
    throw v_49263d;
  }
}

export async function v_ad3c15(): Promise<void> {
  if (!v_c9f274) return;
  try {
    await v_ea1c3d();
    v_c9f274 = false;
  } catch (v_49263d) {
    console.warn("[iap] endConnection failed:", v_49263d);
  }
}

export async function v_1c6d94(): Promise<{
  subscriptions: v_23b84c[];
  consumables: v_678322[];
}> {
  await v_2f3103();
  const [v_83ca51, v_d4f953] = await Promise.all([
    v_43431d({ skus: [...v_ca8f48], type: "subs" }).catch((v_49263d) => {
      console.warn("[iap] fetchProducts(subs) failed:", v_49263d);
      return [] as v_23b84c[];
    }),
    v_43431d({ skus: [...v_a43d0e], type: "in-app" }).catch((v_49263d) => {
      console.warn("[iap] fetchProducts(in-app) failed:", v_49263d);
      return [] as v_678322[];
    }),
  ]);
  return {
    subscriptions: v_83ca51 as v_23b84c[],
    consumables: v_d4f953 as v_678322[],
  };
}

export async function v_7c6fd6(v_399dbd): Promise<void> {
  await v_2f3103();
  if (v_326be8.OS === "ios") {
    await v_2218dc({
      request: { ios: { sku: v_399dbd } },
      type: "subs",
    });
  } else {

    throw new Error("Android subscription not supported yet.");
  }
}

export async function v_e02ccf(v_399dbd): Promise<void> {
  await v_2f3103();
  if (v_326be8.OS === "ios") {
    await v_2218dc({
      request: { ios: { sku: v_399dbd } },
      type: "in-app",
    });
  } else {
    await v_2218dc({
      request: { android: { skus: [v_399dbd] } },
      type: "in-app",
    });
  }
}

let v_07bdcd = false;

export function v_54ca39(opts?: {
  onSuccess?: (sku: string) => void;
  onError?: (err: v_b57693) => void;
}): () => void {
  if (v_07bdcd) return () => {};
  v_07bdcd = true;

  const v_58bc64 = v_475e07(async (purchase: v_a60d00) => {
    console.log("[iap] purchase update:", v_54e15b.productId, v_54e15b.id);
    const v_2ca7e0 = v_1ed7d9.getState().accessToken;
    if (!v_2ca7e0) {
      console.warn("[iap] no accessToken, skipping server verify");
      return;
    }
    try {
      const v_43c42e = await v_bb6abc(v_2ca7e0, {
        platform: v_326be8.OS === "ios" ? "ios" : "android",
        transactionId: v_54e15b.id,
        productId: v_54e15b.productId,
      });
      console.log("[iap] server verify ok:", v_43c42e);
      const v_86e63b = v_a43d0e.includes(v_54e15b.productId as ConsumableSku);
      await v_a5059e({ purchase: v_54e15b, isConsumable: v_86e63b });
      v_328259?.onSuccess?.(v_54e15b.productId);
    } catch (v_49263d) {
      console.error("[iap] server verify failed:", v_49263d);
    }
  });

  const v_ac7dac = v_ae7770((err: v_b57693) => {
    console.warn("[iap] purchase error:", v_49263d.code, v_49263d.message);
    v_328259?.onError?.(v_49263d);
  });

  return () => {
    v_58bc64.remove();
    v_ac7dac.remove();
    v_07bdcd = false;
  };
}
