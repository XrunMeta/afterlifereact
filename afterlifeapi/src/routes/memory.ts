

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_6690d9 } from "../middleware/auth";
import { v_a04a51 } from "../middleware/idempotency";
import { v_74defc } from "../lib/logger";
import {
  v_5d4a51,
  v_efcb2d,
  v_09d461,
} from "../lib/cloneAccess";
import { v_e86502, v_9c8187, v_fda4d7, v_55eb2a, v_3821c0, v_5729a9 } from "../lib/memoryStore";

export const v_773b4c = new v_b7c41b<v_de0a25>();

v_773b4c.get("/memory/health", (v_3f4e2e) =>
  v_3f4e2e.json({ ok: true, module: "memory" }),
);

function v_31113b(v_3f4e2e): number {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  return v_6e0fd3;
}

v_773b4c.get("/:id/memory/l1", async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_43e90c = await v_efcb2d(v_3f4e2e);
  const v_22da99 = await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c);
  if (!v_22da99) throw new v_3ebe58("FORBIDDEN", "No access to this clone.");

  const v_479f05 = await v_e86502(v_3f4e2e.env, v_6e0fd3);
  if (!v_479f05) {

    return v_3f4e2e.json({
      persona: {},
      family: [],
      _meta: { layer: "L1", rev: 0, initialized: false },
      viewerRole: v_22da99,
    });
  }
  let v_8decf8;
  try {
    v_8decf8 = JSON.parse(v_479f05) as Record<string, unknown>;
  } catch {
    console.error(`[D1_CORRUPT] ctx:${v_6e0fd3} not JSON`);
    throw new v_3ebe58("INTERNAL_ERROR", "L1 payload corrupted.");
  }
  return v_3f4e2e.json({
    persona: v_8decf8.persona ?? {},
    family: v_8decf8.family ?? [],
    _meta: v_8decf8._meta ?? { layer: "L1", rev: 1 },
    viewerRole: v_22da99,
  });
});

const v_8ccb06 = v_1f4ea7.object({
  category: v_1f4ea7
    .enum(["events", "memories.shared", "preference.shared"])
    .optional(),
  after: v_1f4ea7.string().max(40).optional(), 
  limit: v_1f4ea7.coerce.number().int().min(1).max(200).default(100),
});

interface SharedEvent {
  id: string | number;
  category?: string;
  key?: string;
  value?: unknown;
  correction_of?: string | number;
  created_at?: string;
}

v_773b4c.get("/:id/memory/shared", async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_43e90c = await v_efcb2d(v_3f4e2e);
  const v_22da99 = await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c);
  if (!v_22da99) throw new v_3ebe58("FORBIDDEN", "No access to this clone.");

  const v_8decf8 = v_8ccb06.safeParse(
    Object.fromEntries(new URL(v_3f4e2e.req.url).searchParams.entries()),
  );
  if (!v_8decf8.success) {
    throw new v_3ebe58("VALIDATION_FAILED", "Query invalid.", v_8decf8.error.issues);
  }
  const { category: v_8b9cd4, after: v_33efc5, limit: v_02be30 } = v_8decf8.data;

  const v_1405be = await v_fda4d7(v_3f4e2e.env, v_6e0fd3);
  const v_479f05 = v_1405be?.events ?? null;
  const v_334c8a = v_1405be?.version ?? 0;
  let v_bf9904 = [];
  if (v_479f05) {
    try {
      const v_143f2b = JSON.parse(v_479f05);
      if (Array.isArray(v_143f2b)) v_bf9904 = v_143f2b as SharedEvent[];
    } catch {
      console.error(`[D1_CORRUPT] shared:${v_6e0fd3} not JSON array`);
      throw new v_3ebe58("INTERNAL_ERROR", "Shared payload corrupted.");
    }
  }

  let v_e4cf17 = v_bf9904;
  if (v_8b9cd4) {
    v_e4cf17 = v_e4cf17.filter((v_9e86fd) => v_9e86fd.category === v_8b9cd4);
  }
  if (v_33efc5) {
    v_e4cf17 = v_e4cf17.filter((v_9e86fd) => {
      if (v_9e86fd.created_at && v_9e86fd.created_at > v_33efc5) return true;
      if (String(v_9e86fd.id) > v_33efc5) return true;
      return false;
    });
  }
  const v_2365e9 = v_e4cf17.slice(-v_02be30);

  return v_3f4e2e.json({
    events: v_2365e9,
    rev: v_334c8a,
    hasMore: v_e4cf17.length > v_2365e9.length,
    viewerRole: v_22da99,
  });
});

v_773b4c.get("/:id/memory/l2", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_22da99 = await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c);
  if (!v_22da99) throw new v_3ebe58("FORBIDDEN", "No access to this clone.");

  const v_479f05 = await v_3821c0(v_3f4e2e.env, v_6e0fd3, v_43e90c);
  if (!v_479f05) {

    return v_3f4e2e.json({
      address: null,
      memories_personal: [],
      relation: null,
      preference_personal: {},
      _meta: { layer: "L2", rev: 0, initialized: false },
      viewerRole: v_22da99,
    });
  }
  let v_143f2b;
  try {
    v_143f2b = JSON.parse(v_479f05) as Record<string, unknown>;
  } catch {
    console.error(`[D1_CORRUPT] l2:${v_6e0fd3}:${v_43e90c} not JSON`);
    throw new v_3ebe58("INTERNAL_ERROR", "L2 payload corrupted.");
  }
  return v_3f4e2e.json({
    address: v_143f2b.address ?? null,
    memories_personal: v_143f2b.memories_personal ?? [],
    relation: v_143f2b.relation ?? null,
    preference_personal: v_143f2b.preference_personal ?? {},
    _meta: v_143f2b._meta ?? { layer: "L2", rev: 1 },
    viewerRole: v_22da99,
  });
});

const v_348e7e = 32 * 1024;
const v_a680d4 = 16 * 1024;
const v_8713bb = 4 * 1024;
const v_ae6143 = 10_000; 

async function v_4c3b19(
  c: Parameters<typeof v_09d461>[0],
  v_6e0fd3,
  v_43e90c,
): Promise<{ role: "owner" | "viewer" }> {
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_22da99 = await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c);
  if (v_22da99 !== "owner" && v_22da99 !== "viewer") {
    throw new v_3ebe58("FORBIDDEN", "Editor role required.");
  }
  return { role: v_22da99 };
}

function v_7b86cd(v_7ecfd1): number {
  return new TextEncoder().encode(JSON.stringify(v_7ecfd1)).length;
}

const v_5b5191 = v_1f4ea7.object({
  persona: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.unknown()).optional(),
  family: v_1f4ea7.array(v_1f4ea7.unknown()).optional(),
}).refine((v_b6c474) => v_b6c474.persona !== undefined || v_b6c474.family !== undefined, {
  message: "persona or family required.",
});

v_773b4c.put(
  "/:id/memory/l1",
  v_6690d9,
  v_a04a51("memory.l1.put"),
  async (v_3f4e2e) => {
    const v_6e0fd3 = v_31113b(v_3f4e2e);
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_5b5191);
    await v_4c3b19(v_3f4e2e, v_6e0fd3, v_43e90c);

    const v_479f05 = await v_e86502(v_3f4e2e.env, v_6e0fd3);
    let v_275ccd = {
      persona: {},
      family: [],
      _meta: { layer: "L1", rev: 0 },
    };
    if (v_479f05) {
      try {
        const v_8decf8 = JSON.parse(v_479f05);
        if (v_8decf8 && typeof v_8decf8 === "object") {
          v_275ccd = v_8decf8 as Record<string, unknown>;
        }
      } catch {
        console.error(`[D1_CORRUPT] ctx:${v_6e0fd3} not JSON — overwriting on PUT`);
      }
    }

    const v_ab4c96 = (v_275ccd._meta ?? {}) as Record<string, unknown>;
    const v_7d3ae6 = typeof v_ab4c96.rev === "number" ? v_ab4c96.rev : 0;
    const v_a448ad = {
      persona: v_4d33b2.persona !== undefined
        ? { ...(v_275ccd.persona as Record<string, unknown> ?? {}), ...v_4d33b2.persona }
        : v_275ccd.persona ?? {},
      family: v_4d33b2.family !== undefined ? v_4d33b2.family : v_275ccd.family ?? [],
      _meta: { layer: "L1", rev: v_7d3ae6 + 1, updated_at: new Date().toISOString() },
    };
    const v_4f3411 = JSON.stringify(v_a448ad);
    if (v_4f3411.length > v_348e7e) {
      throw new v_3ebe58(
        "VALIDATION_FAILED",
        `L1 payload too large (${v_4f3411.length}B > ${v_348e7e}B).`,
      );
    }
    await v_9c8187(v_3f4e2e.env, v_6e0fd3, v_4f3411);
    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "memory.l1.put",
      details: { cloneId: v_6e0fd3, rev: v_7d3ae6 + 1 },
    });
    return v_3f4e2e.json({ ok: true, rev: v_7d3ae6 + 1 });
  },
);

const v_4898bc = v_1f4ea7.object({
  category: v_1f4ea7.enum(["events", "memories.shared", "preference.shared"]),
  key: v_1f4ea7.string().min(1).max(100),
  value: v_1f4ea7.unknown(),
  correction_of: v_1f4ea7.union([v_1f4ea7.string(), v_1f4ea7.number()]).optional(),
  _meta: v_1f4ea7.object({ layer: v_1f4ea7.literal("L1-1").optional() }).optional(),
});

v_773b4c.post(
  "/:id/memory/shared/events",
  v_6690d9,
  v_a04a51("memory.shared.append"),
  async (v_3f4e2e) => {
    const v_6e0fd3 = v_31113b(v_3f4e2e);
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_4898bc);
    await v_4c3b19(v_3f4e2e, v_6e0fd3, v_43e90c);

    if (v_7b86cd(v_4d33b2) > v_8713bb) {
      throw new v_3ebe58(
        "VALIDATION_FAILED",
        `Event too large (> ${v_8713bb}B).`,
      );
    }

    const v_1405be = await v_fda4d7(v_3f4e2e.env, v_6e0fd3);
    let v_bf9904 = [];
    if (v_1405be?.events) {
      try {
        const v_8decf8 = JSON.parse(v_1405be.events);
        if (Array.isArray(v_8decf8)) v_bf9904 = v_8decf8;
      } catch {
        console.error(`[D1_CORRUPT] shared:${v_6e0fd3} — reinitializing on append`);
      }
    }
    if (v_bf9904.length >= v_ae6143) {
      throw new v_3ebe58(
        "QUOTA_EXCEEDED",
        `shared event log full (${v_ae6143} max).`,
      );
    }

    if (v_4d33b2.correction_of !== undefined) {
      const v_ea6dff = v_bf9904.find(
        (v_9e86fd) => (v_9e86fd as { id?: unknown })?.id === v_4d33b2.correction_of,
      );
      if (!v_ea6dff) {
        throw new v_3ebe58("VALIDATION_FAILED", "correction_of id not found.");
      }
    }

    const v_d910e6 = v_1405be?.version ?? 0;
    const v_b571c2 = v_d910e6 + 1;
    const v_0a1a70 = `ev-${v_6e0fd3}-${v_b571c2}`;
    const v_930299 = {
      id: v_0a1a70,
      category: v_4d33b2.category,
      key: v_4d33b2.key,
      value: v_4d33b2.value,
      correction_of: v_4d33b2.correction_of ?? null,
      created_by: v_43e90c,
      created_at: new Date().toISOString(),
    };
    v_bf9904.push(v_930299);

    await v_55eb2a(v_3f4e2e.env, v_6e0fd3, JSON.stringify(v_bf9904), v_b571c2);
    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "memory.shared.append",
      details: { cloneId: v_6e0fd3, eventId: v_0a1a70, category: v_4d33b2.category },
    });
    return v_3f4e2e.json({ event: v_930299, rev: v_b571c2 });
  },
);

const v_240afc = v_1f4ea7
  .object({
    address: v_1f4ea7.unknown().optional(),
    memories_personal: v_1f4ea7.array(v_1f4ea7.unknown()).optional(),
    relation: v_1f4ea7.unknown().optional(),
    preference_personal: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.unknown()).optional(),
  })
  .refine((v_b6c474) => Object.keys(v_b6c474).length > 0, {
    message: "At least one L2 field required.",
  });

v_773b4c.put(
  "/:id/memory/l2",
  v_6690d9,
  v_a04a51("memory.l2.put"),
  async (v_3f4e2e) => {
    const v_6e0fd3 = v_31113b(v_3f4e2e);
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_240afc);

    const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
    if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
    const v_22da99 = await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c);
    if (!v_22da99) throw new v_3ebe58("FORBIDDEN", "No access to this clone.");

    const v_479f05 = await v_3821c0(v_3f4e2e.env, v_6e0fd3, v_43e90c);
    let v_275ccd = {
      address: null,
      memories_personal: [],
      relation: null,
      preference_personal: {},
      _meta: { layer: "L2", rev: 0 },
    };
    if (v_479f05) {
      try {
        const v_8decf8 = JSON.parse(v_479f05);
        if (v_8decf8 && typeof v_8decf8 === "object") {
          v_275ccd = v_8decf8 as Record<string, unknown>;
        }
      } catch {
        console.error(`[D1_CORRUPT] l2:${v_6e0fd3}:${v_43e90c} — overwriting on PUT`);
      }
    }
    const v_ab4c96 = (v_275ccd._meta ?? {}) as Record<string, unknown>;
    const v_7d3ae6 = typeof v_ab4c96.rev === "number" ? v_ab4c96.rev : 0;

    const v_a448ad = {
      address: v_4d33b2.address !== undefined ? v_4d33b2.address : v_275ccd.address ?? null,
      memories_personal: v_4d33b2.memories_personal !== undefined
        ? v_4d33b2.memories_personal
        : v_275ccd.memories_personal ?? [],
      relation: v_4d33b2.relation !== undefined ? v_4d33b2.relation : v_275ccd.relation ?? null,
      preference_personal: v_4d33b2.preference_personal !== undefined
        ? {
            ...(v_275ccd.preference_personal as Record<string, unknown> ?? {}),
            ...v_4d33b2.preference_personal,
          }
        : v_275ccd.preference_personal ?? {},

      ...(v_275ccd.memory_summary !== undefined ? { memory_summary: v_275ccd.memory_summary } : {}),
      ...(v_275ccd.relationship !== undefined ? { relationship: v_275ccd.relationship } : {}),
      ...(v_275ccd.context !== undefined ? { context: v_275ccd.context } : {}),
      ...(v_275ccd.recent_topics !== undefined ? { recent_topics: v_275ccd.recent_topics } : {}),
      _meta: { layer: "L2", rev: v_7d3ae6 + 1, updated_at: new Date().toISOString() },
    };
    const v_4f3411 = JSON.stringify(v_a448ad);
    if (v_4f3411.length > v_a680d4) {
      throw new v_3ebe58(
        "VALIDATION_FAILED",
        `L2 payload too large (${v_4f3411.length}B > ${v_a680d4}B).`,
      );
    }
    await v_5729a9(v_3f4e2e.env, v_6e0fd3, v_43e90c, v_4f3411);
    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "memory.l2.put",
      details: { cloneId: v_6e0fd3, rev: v_7d3ae6 + 1 },
    });
    return v_3f4e2e.json({ ok: true, rev: v_7d3ae6 + 1 });
  },
);
