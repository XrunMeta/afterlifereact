

export type PlanCode = "light" | "basic" | "standard" | "plus" | "premium";

export interface IapProduct {
  productId: string;
  kind: "subscription" | "consumable";
  creditsSec: number;
  planCode?: PlanCode;
}

const PREFIX = "run.xrun.afterlife";

const PRODUCTS: readonly IapProduct[] = [

  { productId: `${PREFIX}.sub.light`,    kind: "subscription", creditsSec: 3000,  planCode: "light" },

  { productId: `${PREFIX}.sub.basic.v3`, kind: "subscription", creditsSec: 6000,  planCode: "basic" },
  { productId: `${PREFIX}.sub.standard`, kind: "subscription", creditsSec: 12000, planCode: "standard" },
  { productId: `${PREFIX}.sub.plus`,     kind: "subscription", creditsSec: 24000, planCode: "plus" },
  { productId: `${PREFIX}.sub.premium`,  kind: "subscription", creditsSec: 36000, planCode: "premium" },

  { productId: `${PREFIX}.credit.30`,  kind: "consumable", creditsSec: 1800 },
  { productId: `${PREFIX}.credit.60`,  kind: "consumable", creditsSec: 3600 },
  { productId: `${PREFIX}.credit.150`, kind: "consumable", creditsSec: 9000 },
  { productId: `${PREFIX}.credit.300`, kind: "consumable", creditsSec: 18000 },

  { productId: "credits_1000", kind: "consumable", creditsSec: 1000 },
];

const BY_ID = new Map(PRODUCTS.map((p) => [p.productId, p]));

export function lookupProduct(productId: string): IapProduct | null {
  return BY_ID.get(productId) ?? null;
}

export const TOPUP_TTL_MS = 5 * 365 * 24 * 60 * 60 * 1000;
