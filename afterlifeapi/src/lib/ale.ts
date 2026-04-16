

import { gcm } from "@noble/ciphers/aes.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/ciphers/utils.js";
import { APIError } from "./errors";

const V1 = "v1";
const V2 = "v2";
const V3 = "v3";

export function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function unb64(str: string): Uint8Array {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface KekProvider {
  resolve(kekId: string): Uint8Array;
  current(): string;
}

let cachedProvider: KekProvider | null = null;
let cachedKeyB64: string | null = null;

export function getKekProvider(kekB64: string): KekProvider {
  if (cachedProvider && cachedKeyB64 === kekB64) return cachedProvider;
  cachedProvider = createDevKekProvider(kekB64);
  cachedKeyB64 = kekB64;
  return cachedProvider;
}

export function createDevKekProvider(kekB64: string): KekProvider {
  let bytes: Uint8Array;
  try {
    bytes = unb64(kekB64);
  } catch {
    throw new APIError("INTERNAL_ERROR", "ALE_KEK is not valid base64.");
  }
  if (bytes.length !== 32) {
    throw new APIError("INTERNAL_ERROR", "ALE_KEK must decode to 32 bytes.");
  }
  const DEV_ID = "dev-1";
  return {
    resolve(kekId: string) {
      if (kekId !== DEV_ID) {
        throw new APIError("INTERNAL_ERROR", `Unknown kek_id: ${kekId}`);
      }
      return bytes;
    },
    current() {
      return DEV_ID;
    },
  };
}

function deriveDek(kek: Uint8Array, salt: Uint8Array, info: string): Uint8Array {
  return hkdf(sha256, kek, salt, new TextEncoder().encode(info), 32);
}

export function seal(plaintext: string, provider: KekProvider, context: string): string {
  const kekId = provider.current();
  const kek = provider.resolve(kekId);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const dek = deriveDek(kek, salt, `ale:${context}`);
  const ct = gcm(dek, iv).encrypt(new TextEncoder().encode(plaintext));
  return `${V2}.${kekId}.${b64(salt)}.${b64(iv)}.${b64(ct)}`;
}

export function open(blob: string, provider: KekProvider, context: string): string {
  const parts = blob.split(".");
  const version = parts[0];

  let kekId: string;
  let sB64: string;
  let iB64: string;
  let ctB64: string;

  if (version === V2) {
    if (parts.length !== 5) throw new APIError("INTERNAL_ERROR", "Malformed ALE v2 blob.");
    [, kekId, sB64, iB64, ctB64] = parts as [string, string, string, string, string];
  } else if (version === V1) {
    if (parts.length !== 4) throw new APIError("INTERNAL_ERROR", "Malformed ALE v1 blob.");
    kekId = provider.current();
    [, sB64, iB64, ctB64] = parts as [string, string, string, string];
  } else if (version === V3) {
    throw new APIError("INTERNAL_ERROR", "v3 blob requires openV3() with DB handle.");
  } else {
    throw new APIError("INTERNAL_ERROR", `Unsupported ALE version: ${version}`);
  }

  const kek = provider.resolve(kekId);
  const salt = unb64(sB64);
  const iv = unb64(iB64);
  const ct = unb64(ctB64);
  const dek = deriveDek(kek, salt, `ale:${context}`);
  try {
    const pt = gcm(dek, iv).decrypt(ct);
    return new TextDecoder().decode(pt);
  } catch {
    throw new APIError("INTERNAL_ERROR", "ALE decryption failed (tampered or wrong key).");
  }
}

export type MigrateHintKey = "users.phone" | "users.age_enc" | "messages.content";

export interface MigrateHint {
  key: MigrateHintKey;
  resourceId: string | number;
}

interface MigrateSpec {
  table: "users" | "messages";
  column: "phone" | "age_enc" | "content";
  where: "id";
  resourceType: "user.phone" | "user.age" | "message.content";
}

const MIGRATE_MAP: Record<MigrateHintKey, MigrateSpec> = {
  "users.phone":      { table: "users",    column: "phone",   where: "id", resourceType: "user.phone" },
  "users.age_enc":    { table: "users",    column: "age_enc", where: "id", resourceType: "user.age" },
  "messages.content": { table: "messages", column: "content", where: "id", resourceType: "message.content" },
};

export interface OpenAnyOptions {
  db: D1Database;
  hkdfContext: string;              
  legacyProvider: KekProvider;      
  v3Provider: KekProvider;          
  actor: { type: "user" | "admin" | "heir" | "system"; id: string | number };
  auditSecret: string;
  lazyMigrateEnabled: boolean;
  hint?: MigrateHint;
}

export async function openAny(blob: string, opts: OpenAnyOptions): Promise<string> {
  if (blob.startsWith(`${V3}.`)) {
    return openV3(opts.db, blob, opts.v3Provider, { lazyRotationEnabled: false });
  }

  const plain = open(blob, opts.legacyProvider, opts.hkdfContext);

  if (!opts.lazyMigrateEnabled || !opts.hint) return plain;
  const spec = MIGRATE_MAP[opts.hint.key];
  if (!spec) return plain;

  let newBlob: string;
  try {
    newBlob = await sealV3(
      opts.db,
      plain,
      opts.v3Provider,
      { type: spec.resourceType, id: String(opts.hint.resourceId) },
    );
  } catch (err) {

    console.error(`[V2_MIGRATE_SEAL_FAIL] key=${opts.hint.key} id=${opts.hint.resourceId} err=${(err as Error).message}`);
    return plain;
  }

  try {

    await opts.db
      .prepare(`UPDATE ${spec.table} SET ${spec.column}=? WHERE ${spec.where}=? AND ${spec.column}=?`)
      .bind(newBlob, opts.hint.resourceId, blob)
      .run();
  } catch (err) {
    console.error(`[V2_MIGRATE_UPDATE_FAIL] key=${opts.hint.key} id=${opts.hint.resourceId} err=${(err as Error).message}`);
    return plain;
  }

  try {
    const { writeDecryptionAudit } = await import("./auditChain");
    await writeDecryptionAudit(opts.db, opts.auditSecret, {
      actor: { type: opts.actor.type, id: opts.actor.id },
      op: "v2_migrate",
      resourceType: spec.resourceType,
      resourceId: String(opts.hint.resourceId),
      reason: null,
    });
  } catch (err) {
    console.error(`[V2_MIGRATE_AUDIT_FAIL] key=${opts.hint.key} id=${opts.hint.resourceId} err=${(err as Error).message}`);
  }

  return plain;
}

export interface V3Resource {
  type: string;   
  id: string;     
}

function randDekId(): string {
  const r = randomBytes(16);
  let hex = "";
  for (const b of r) hex += b.toString(16).padStart(2, "0");
  return `dek_${hex}`;
}

function wrapDek(kek: Uint8Array, dek: Uint8Array): string {
  const wrapIv = randomBytes(12);
  const wrapped = gcm(kek, wrapIv).encrypt(dek);
  return `${b64(wrapIv)}.${b64(wrapped)}`;
}

function unwrapDek(kek: Uint8Array, encryptedDek: string): Uint8Array {
  const [wrapIvB64, wrappedB64] = encryptedDek.split(".");
  if (!wrapIvB64 || !wrappedB64) {
    throw new APIError("INTERNAL_ERROR", "Malformed encrypted_dek.");
  }
  try {
    return gcm(kek, unb64(wrapIvB64)).decrypt(unb64(wrappedB64));
  } catch {
    throw new APIError("INTERNAL_ERROR", "DEK unwrap failed.");
  }
}

export async function sealV3(
  db: D1Database,
  plaintext: string,
  provider: KekProvider,
  resource: V3Resource,
): Promise<string> {
  const kekId = provider.current();
  const kek = provider.resolve(kekId);
  const dek = randomBytes(32);
  const dekId = randDekId();
  const encryptedDek = wrapDek(kek, dek);

  await db
    .prepare(
      `INSERT INTO dek_registry (dek_id, resource_type, resource_id, kek_id, encrypted_dek)
         VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(dekId, resource.type, resource.id, kekId, encryptedDek)
    .run();

  const iv = randomBytes(12);
  const ct = gcm(dek, iv).encrypt(new TextEncoder().encode(plaintext));
  return `${V3}.${kekId}.${dekId}.${b64(iv)}.${b64(ct)}`;
}

export interface OpenV3Opts {

  lazyRotationEnabled?: boolean;

  onRotated?: (info: { dekId: string; fromKekId: string; toKekId: string }) => Promise<void>;
}

export async function openV3(
  db: D1Database,
  blob: string,
  provider: KekProvider,
  opts?: OpenV3Opts,
): Promise<string> {
  const parts = blob.split(".");
  if (parts[0] !== V3 || parts.length !== 5) {
    throw new APIError("INTERNAL_ERROR", "Malformed ALE v3 blob.");
  }
  const [, _blobKekId, dekId, ivB64, ctB64] = parts as [string, string, string, string, string];

  const row = await db
    .prepare(
      `SELECT encrypted_dek, kek_id, shredded_at FROM dek_registry WHERE dek_id = ?`,
    )
    .bind(dekId)
    .first<{ encrypted_dek: string; kek_id: string; shredded_at: string | null }>();
  if (!row) throw new APIError("INTERNAL_ERROR", `DEK not found: ${dekId}`);
  if (row.shredded_at) {
    throw new APIError("SHREDDED", "Content is cryptographically shredded.");
  }

  const kek = provider.resolve(row.kek_id);
  const dek = unwrapDek(kek, row.encrypted_dek);

  let plain: string;
  try {
    const pt = gcm(dek, unb64(ivB64)).decrypt(unb64(ctB64));
    plain = new TextDecoder().decode(pt);
  } catch {
    throw new APIError("INTERNAL_ERROR", "ALE v3 decryption failed.");
  }

  if (opts?.lazyRotationEnabled) {
    const currentKid = provider.current();
    if (row.kek_id !== currentKid) {
      const newKek = provider.resolve(currentKid);
      const rewrapped = wrapDek(newKek, dek);
      const result = await db
        .prepare(
          `UPDATE dek_registry
              SET encrypted_dek = ?, kek_id = ?, rotated_at = CURRENT_TIMESTAMP
            WHERE dek_id = ? AND kek_id = ?`,
        )
        .bind(rewrapped, currentKid, dekId, row.kek_id)
        .run();
      if (result.success && result.meta && result.meta.changes && result.meta.changes > 0) {
        if (opts.onRotated) {
          await opts.onRotated({ dekId, fromKekId: row.kek_id, toKekId: currentKid });
        }
      } else if (!result.success) {
        console.error(`[ALE] lazy rotation UPDATE failed for dekId=${dekId}`);
      }

    }
  }

  return plain;
}

export async function shredV3(db: D1Database, dekId: string): Promise<void> {
  await db
    .prepare(
      `UPDATE dek_registry
          SET shredded_at = CURRENT_TIMESTAMP, encrypted_dek = ''
        WHERE dek_id = ? AND shredded_at IS NULL`,
    )
    .bind(dekId)
    .run();
}

export function extractDekId(blob: string): string | null {
  const parts = blob.split(".");
  if (parts[0] !== V3 || parts.length !== 5) return null;
  return parts[2] ?? null;
}

export function hmacChain(prevHash: string | null, row: unknown, secret: string): Promise<string> {
  const payload = (prevHash ?? "") + JSON.stringify(row);
  return hmacSha256(secret, payload);
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const bytes = new Uint8Array(sig);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}
