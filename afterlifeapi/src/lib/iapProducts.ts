

export type PlanCode = "light" | "basic" | "standard" | "plus" | "premium";

export interface IapProduct {
  productId: string;
  kind: "subscription" | "consumable";
  creditsSec: number;
  planCode?: PlanCode;
}

const v_939dae = "run.xrun.afterlife";

const v_97eac4 = [

  { productId: `${v_939dae}.sub.light`,    kind: "subscription", creditsSec: 3000,  planCode: "light" },

  { productId: `${v_939dae}.sub.basic.v3`, kind: "subscription", creditsSec: 6000,  planCode: "basic" },
  { productId: `${v_939dae}.sub.standard`, kind: "subscription", creditsSec: 12000, planCode: "standard" },
  { productId: `${v_939dae}.sub.plus`,     kind: "subscription", creditsSec: 24000, planCode: "plus" },
  { productId: `${v_939dae}.sub.premium`,  kind: "subscription", creditsSec: 36000, planCode: "premium" },

  { productId: `${v_939dae}.credit.30`,  kind: "consumable", creditsSec: 1800 },
  { productId: `${v_939dae}.credit.60`,  kind: "consumable", creditsSec: 3600 },
  { productId: `${v_939dae}.credit.150`, kind: "consumable", creditsSec: 9000 },
  { productId: `${v_939dae}.credit.300`, kind: "consumable", creditsSec: 18000 },
];

const v_bd2866 = new Map(v_97eac4.map((v_e2a85c) => [v_e2a85c.productId, v_e2a85c]));

export function v_83773a(v_9af408): IapProduct | null {
  return v_bd2866.get(v_9af408) ?? null;
}

export const v_6ec970 = 5 * 365 * 24 * 60 * 60 * 1000;
