

import { v_326be8 } from "rcmrninabrnb";
import {
  v_84436a,
  v_ea1c3d,
  v_519a14,
  v_453d4b,
  v_2218dc,
  v_c83fe1,
  v_a5059e,
  v_475e07,
  v_ae7770,
  type v_678322,
  type v_813adb,
  type v_c064a4,
  type v_533605,
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

export async function v_43431d(): Promise<{
  subscriptions: v_813adb[];
  consumables: v_678322[];
}> {
  await v_2f3103();
  const [v_60a14d, v_275767] = await Promise.all([
    v_453d4b({ skus: [...v_ca8f48] }).catch((v_49263d) => {
      console.warn("[iap] getSubscriptions failed:", v_49263d);
      return [];
    }),
    v_519a14({ skus: [...v_a43d0e] }).catch((v_49263d) => {
      console.warn("[iap] getProducts failed:", v_49263d);
      return [];
    }),
  ]);
  return { subscriptions: v_60a14d, consumables: v_275767 };
}

export async function v_7c6fd6(v_399dbd): Promise<void> {
  await v_2f3103();
  if (v_326be8.OS === "ios") {
    await v_c83fe1({ sku: v_399dbd });
  } else {

    throw new Error("Android subscription not supported yet.");
  }
}

export async function v_e02ccf(v_399dbd): Promise<void> {
  await v_2f3103();
  await v_2218dc({ sku: v_399dbd });
}

let v_07bdcd = false;

export function v_54ca39(opts?: {
  onSuccess?: (sku: string) => void;
  onError?: (err: v_b57693) => void;
}): () => void {
  if (v_07bdcd) return () => {};
  v_07bdcd = true;

  const v_58bc64 = v_475e07(async (purchase: v_c064a4 | v_533605) => {
    console.log("[iap] purchase update:", v_54e15b.productId, v_54e15b.transactionId);
    const v_2ca7e0 = v_1ed7d9.getState().accessToken;
    if (!v_2ca7e0) {
      console.warn("[iap] no accessToken, skipping server verify");
      return;
    }
    try {
      const v_43c42e = await v_bb6abc(v_2ca7e0, {
        platform: v_326be8.OS === "ios" ? "ios" : "android",
        transactionId: v_54e15b.transactionId!,
        productId: v_54e15b.productId,
      });
      console.log("[iap] server verify ok:", v_43c42e);

      await v_a5059e({ purchase: v_54e15b, isConsumable: v_a43d0e.includes(v_54e15b.productId as ConsumableSku) });
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
