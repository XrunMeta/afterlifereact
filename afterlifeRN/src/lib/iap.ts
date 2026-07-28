

import { Platform } from "react-native";
import {
  initConnection,
  endConnection,
  getProducts,
  getSubscriptions,
  requestPurchase,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Product,
  type Subscription,
  type ProductPurchase,
  type SubscriptionPurchase,
  type PurchaseError,
} from "react-native-iap";
import { submitPurchase } from "../api/credits";
import { useAuthStore } from "../stores/authStore";

export const SUBSCRIPTION_SKUS = [
  "run.xrun.afterlife.sub.light",
  "run.xrun.afterlife.sub.basic.v3",
  "run.xrun.afterlife.sub.standard",
  "run.xrun.afterlife.sub.plus",
  "run.xrun.afterlife.sub.premium",
] as const;

export const CONSUMABLE_SKUS = [
  "run.xrun.afterlife.credit.30",
  "run.xrun.afterlife.credit.60",
  "run.xrun.afterlife.credit.150",
  "run.xrun.afterlife.credit.300",
] as const;

export type SubscriptionSku = (typeof SUBSCRIPTION_SKUS)[number];
export type ConsumableSku = (typeof CONSUMABLE_SKUS)[number];

let initialized = false;

export async function initIap(): Promise<void> {
  if (initialized) return;
  try {
    await initConnection();
    initialized = true;
    console.log("[iap] initConnection ok");
  } catch (err) {
    console.warn("[iap] initConnection failed:", err);
    throw err;
  }
}

export async function shutdownIap(): Promise<void> {
  if (!initialized) return;
  try {
    await endConnection();
    initialized = false;
  } catch (err) {
    console.warn("[iap] endConnection failed:", err);
  }
}

export async function fetchProducts(): Promise<{
  subscriptions: Subscription[];
  consumables: Product[];
}> {
  await initIap();
  const [subscriptions, consumables] = await Promise.all([
    getSubscriptions({ skus: [...SUBSCRIPTION_SKUS] }).catch((err) => {
      console.warn("[iap] getSubscriptions failed:", err);
      return [];
    }),
    getProducts({ skus: [...CONSUMABLE_SKUS] }).catch((err) => {
      console.warn("[iap] getProducts failed:", err);
      return [];
    }),
  ]);
  return { subscriptions, consumables };
}

export async function buySubscription(sku: SubscriptionSku): Promise<void> {
  await initIap();
  if (Platform.OS === "ios") {
    await requestSubscription({ sku });
  } else {

    throw new Error("Android subscription not supported yet.");
  }
}

export async function buyConsumable(sku: ConsumableSku): Promise<void> {
  await initIap();
  await requestPurchase({ sku });
}

let listenersRegistered = false;

export function registerPurchaseListeners(opts?: {
  onSuccess?: (sku: string) => void;
  onError?: (err: PurchaseError) => void;
}): () => void {
  if (listenersRegistered) return () => {};
  listenersRegistered = true;

  const updSub = purchaseUpdatedListener(async (purchase: ProductPurchase | SubscriptionPurchase) => {
    console.log("[iap] purchase update:", purchase.productId, purchase.transactionId);
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      console.warn("[iap] no accessToken, skipping server verify");
      return;
    }
    try {
      const result = await submitPurchase(accessToken, {
        platform: Platform.OS === "ios" ? "ios" : "android",
        transactionId: purchase.transactionId!,
        productId: purchase.productId,
      });
      console.log("[iap] server verify ok:", result);

      await finishTransaction({ purchase, isConsumable: CONSUMABLE_SKUS.includes(purchase.productId as ConsumableSku) });
      opts?.onSuccess?.(purchase.productId);
    } catch (err) {

      console.error("[iap] server verify failed:", err);
    }
  });

  const errSub = purchaseErrorListener((err: PurchaseError) => {
    console.warn("[iap] purchase error:", err.code, err.message);
    opts?.onError?.(err);
  });

  return () => {
    updSub.remove();
    errSub.remove();
    listenersRegistered = false;
  };
}
