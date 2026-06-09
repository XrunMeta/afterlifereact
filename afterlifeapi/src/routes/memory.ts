

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { requireIdempotencyKey } from "../middleware/idempotency";
import { logActivity } from "../lib/logger";
import {
  loadCloneById,
  resolveOptionalUser,
  resolveViewerRole,
} from "../lib/cloneAccess";
import { readCtx, writeCtx, readShared, writeShared, readOnt, writeOnt } from "../lib/memoryStore";

export const memory = new Hono<AppEnv>();

memory.get("/memory/health", (c) =>
  c.json({ ok: true, module: "memory" }),
);

function parseCloneId(c: { req: { param: (k: string) => string } }): number {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  return cloneId;
}

memory.get("/:id/memory/l1", async (c) => {
  const cloneId = parseCloneId(c);
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
  const userId = await resolveOptionalUser(c);
  const role = await resolveViewerRole(c, clone, userId);
  if (!role) throw new APIError("FORBIDDEN", "No access to this clone.");

  const raw = await readCtx(c.env, cloneId);
  if (!raw) {

    return c.json({
      persona: {},
      family: [],
      _meta: { layer: "L1", rev: 0, initialized: false },
      viewerRole: role,
    });
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.error(`[D1_CORRUPT] ctx:${cloneId} not JSON`);
    throw new APIError("INTERNAL_ERROR", "L1 payload corrupted.");
  }
  return c.json({
    persona: parsed.persona ?? {},
    family: parsed.family ?? [],
    _meta: parsed._meta ?? { layer: "L1", rev: 1 },
    viewerRole: role,
  });
});

const sharedQuery = z.object({
  category: z
    .enum(["events", "memories.shared", "preference.shared"])
    .optional(),
  after: z.string().max(40).optional(), 
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

interface SharedEvent {
  id: string | number;
  category?: string;
  key?: string;
  value?: unknown;
  correction_of?: string | number;
  created_at?: string;
}

memory.get("/:id/memory/shared", async (c) => {
  const cloneId = parseCloneId(c);
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
  const userId = await resolveOptionalUser(c);
  const role = await resolveViewerRole(c, clone, userId);
  if (!role) throw new APIError("FORBIDDEN", "No access to this clone.");

  const parsed = sharedQuery.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams.entries()),
  );
  if (!parsed.success) {
    throw new APIError("VALIDATION_FAILED", "Query invalid.", parsed.error.issues);
  }
  const { category, after, limit } = parsed.data;

  const sharedData = await readShared(c.env, cloneId);
  const raw = sharedData?.events ?? null;
  const rev = sharedData?.version ?? 0;
  let events: SharedEvent[] = [];
  if (raw) {
    try {
      const parsedJson = JSON.parse(raw);
      if (Array.isArray(parsedJson)) events = parsedJson as SharedEvent[];
    } catch {
      console.error(`[D1_CORRUPT] shared:${cloneId} not JSON array`);
      throw new APIError("INTERNAL_ERROR", "Shared payload corrupted.");
    }
  }

  let filtered = events;
  if (category) {
    filtered = filtered.filter((e) => e.category === category);
  }
  if (after) {
    filtered = filtered.filter((e) => {
      if (e.created_at && e.created_at > after) return true;
      if (String(e.id) > after) return true;
      return false;
    });
  }
  const page = filtered.slice(-limit);

  return c.json({
    events: page,
    rev,
    hasMore: filtered.length > page.length,
    viewerRole: role,
  });
});

memory.get("/:id/memory/l2", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
  const role = await resolveViewerRole(c, clone, userId);
  if (!role) throw new APIError("FORBIDDEN", "No access to this clone.");

  const raw = await readOnt(c.env, cloneId, userId);
  if (!raw) {

    return c.json({
      address: null,
      memories_personal: [],
      relation: null,
      preference_personal: {},
      _meta: { layer: "L2", rev: 0, initialized: false },
      viewerRole: role,
    });
  }
  let parsedJson: Record<string, unknown>;
  try {
    parsedJson = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.error(`[D1_CORRUPT] l2:${cloneId}:${userId} not JSON`);
    throw new APIError("INTERNAL_ERROR", "L2 payload corrupted.");
  }
  return c.json({
    address: parsedJson.address ?? null,
    memories_personal: parsedJson.memories_personal ?? [],
    relation: parsedJson.relation ?? null,
    preference_personal: parsedJson.preference_personal ?? {},
    _meta: parsedJson._meta ?? { layer: "L2", rev: 1 },
    viewerRole: role,
  });
});

const MAX_L1_BYTES = 32 * 1024;
const MAX_L2_BYTES = 16 * 1024;
const MAX_EVENT_BYTES = 4 * 1024;
const MAX_SHARED_EVENTS = 10_000; 

async function assertEditor(
  c: Parameters<typeof resolveViewerRole>[0],
  cloneId: number,
  userId: number,
): Promise<{ role: "owner" | "viewer" }> {
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
  const role = await resolveViewerRole(c, clone, userId);
  if (role !== "owner" && role !== "viewer") {
    throw new APIError("FORBIDDEN", "Editor role required.");
  }
  return { role };
}

function byteLength(json: unknown): number {
  return new TextEncoder().encode(JSON.stringify(json)).length;
}

const l1PutSchema = z.object({
  persona: z.record(z.string(), z.unknown()).optional(),
  family: z.array(z.unknown()).optional(),
}).refine((o) => o.persona !== undefined || o.family !== undefined, {
  message: "persona or family required.",
});

memory.put(
  "/:id/memory/l1",
  requireAuth,
  requireIdempotencyKey("memory.l1.put"),
  async (c) => {
    const cloneId = parseCloneId(c);
    const userId = c.get("userId")!;
    const body = await parseJson(c, l1PutSchema);
    await assertEditor(c, cloneId, userId);

    const raw = await readCtx(c.env, cloneId);
    let current: Record<string, unknown> = {
      persona: {},
      family: [],
      _meta: { layer: "L1", rev: 0 },
    };
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          current = parsed as Record<string, unknown>;
        }
      } catch {
        console.error(`[D1_CORRUPT] ctx:${cloneId} not JSON — overwriting on PUT`);
      }
    }

    const meta = (current._meta ?? {}) as Record<string, unknown>;
    const prevRev = typeof meta.rev === "number" ? meta.rev : 0;
    const next = {
      persona: body.persona !== undefined
        ? { ...(current.persona as Record<string, unknown> ?? {}), ...body.persona }
        : current.persona ?? {},
      family: body.family !== undefined ? body.family : current.family ?? [],
      _meta: { layer: "L1", rev: prevRev + 1, updated_at: new Date().toISOString() },
    };
    const serialized = JSON.stringify(next);
    if (serialized.length > MAX_L1_BYTES) {
      throw new APIError(
        "VALIDATION_FAILED",
        `L1 payload too large (${serialized.length}B > ${MAX_L1_BYTES}B).`,
      );
    }
    await writeCtx(c.env, cloneId, serialized);
    await logActivity(c, {
      userId,
      action: "memory.l1.put",
      details: { cloneId, rev: prevRev + 1 },
    });
    return c.json({ ok: true, rev: prevRev + 1 });
  },
);

const eventSchema = z.object({
  category: z.enum(["events", "memories.shared", "preference.shared"]),
  key: z.string().min(1).max(100),
  value: z.unknown(),
  correction_of: z.union([z.string(), z.number()]).optional(),
  _meta: z.object({ layer: z.literal("L1-1").optional() }).optional(),
});

memory.post(
  "/:id/memory/shared/events",
  requireAuth,
  requireIdempotencyKey("memory.shared.append"),
  async (c) => {
    const cloneId = parseCloneId(c);
    const userId = c.get("userId")!;
    const body = await parseJson(c, eventSchema);
    await assertEditor(c, cloneId, userId);

    if (byteLength(body) > MAX_EVENT_BYTES) {
      throw new APIError(
        "VALIDATION_FAILED",
        `Event too large (> ${MAX_EVENT_BYTES}B).`,
      );
    }

    const sharedData = await readShared(c.env, cloneId);
    let events: unknown[] = [];
    if (sharedData?.events) {
      try {
        const parsed = JSON.parse(sharedData.events);
        if (Array.isArray(parsed)) events = parsed;
      } catch {
        console.error(`[D1_CORRUPT] shared:${cloneId} — reinitializing on append`);
      }
    }
    if (events.length >= MAX_SHARED_EVENTS) {
      throw new APIError(
        "QUOTA_EXCEEDED",
        `shared event log full (${MAX_SHARED_EVENTS} max).`,
      );
    }

    if (body.correction_of !== undefined) {
      const found = events.find(
        (e) => (e as { id?: unknown })?.id === body.correction_of,
      );
      if (!found) {
        throw new APIError("VALIDATION_FAILED", "correction_of id not found.");
      }
    }

    const currentVer = sharedData?.version ?? 0;
    const nextVer = currentVer + 1;
    const eventId = `ev-${cloneId}-${nextVer}`;
    const newEvent = {
      id: eventId,
      category: body.category,
      key: body.key,
      value: body.value,
      correction_of: body.correction_of ?? null,
      created_by: userId,
      created_at: new Date().toISOString(),
    };
    events.push(newEvent);

    await writeShared(c.env, cloneId, JSON.stringify(events), nextVer);
    await logActivity(c, {
      userId,
      action: "memory.shared.append",
      details: { cloneId, eventId, category: body.category },
    });
    return c.json({ event: newEvent, rev: nextVer });
  },
);

const l2PutSchema = z
  .object({
    address: z.unknown().optional(),
    memories_personal: z.array(z.unknown()).optional(),
    relation: z.unknown().optional(),
    preference_personal: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "At least one L2 field required.",
  });

memory.put(
  "/:id/memory/l2",
  requireAuth,
  requireIdempotencyKey("memory.l2.put"),
  async (c) => {
    const cloneId = parseCloneId(c);
    const userId = c.get("userId")!;
    const body = await parseJson(c, l2PutSchema);

    const clone = await loadCloneById(c.env.DB, cloneId);
    if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
    const role = await resolveViewerRole(c, clone, userId);
    if (!role) throw new APIError("FORBIDDEN", "No access to this clone.");

    const raw = await readOnt(c.env, cloneId, userId);
    let current: Record<string, unknown> = {
      address: null,
      memories_personal: [],
      relation: null,
      preference_personal: {},
      _meta: { layer: "L2", rev: 0 },
    };
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          current = parsed as Record<string, unknown>;
        }
      } catch {
        console.error(`[D1_CORRUPT] l2:${cloneId}:${userId} — overwriting on PUT`);
      }
    }
    const meta = (current._meta ?? {}) as Record<string, unknown>;
    const prevRev = typeof meta.rev === "number" ? meta.rev : 0;

    const next = {
      address: body.address !== undefined ? body.address : current.address ?? null,
      memories_personal: body.memories_personal !== undefined
        ? body.memories_personal
        : current.memories_personal ?? [],
      relation: body.relation !== undefined ? body.relation : current.relation ?? null,
      preference_personal: body.preference_personal !== undefined
        ? {
            ...(current.preference_personal as Record<string, unknown> ?? {}),
            ...body.preference_personal,
          }
        : current.preference_personal ?? {},

      ...(current.memory_summary !== undefined ? { memory_summary: current.memory_summary } : {}),
      ...(current.relationship !== undefined ? { relationship: current.relationship } : {}),
      ...(current.context !== undefined ? { context: current.context } : {}),
      ...(current.recent_topics !== undefined ? { recent_topics: current.recent_topics } : {}),
      _meta: { layer: "L2", rev: prevRev + 1, updated_at: new Date().toISOString() },
    };
    const serialized = JSON.stringify(next);
    if (serialized.length > MAX_L2_BYTES) {
      throw new APIError(
        "VALIDATION_FAILED",
        `L2 payload too large (${serialized.length}B > ${MAX_L2_BYTES}B).`,
      );
    }
    await writeOnt(c.env, cloneId, userId, serialized);
    await logActivity(c, {
      userId,
      action: "memory.l2.put",
      details: { cloneId, rev: prevRev + 1 },
    });
    return c.json({ ok: true, rev: prevRev + 1 });
  },
);
