

import { Hono } from "hono";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";

import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { issueSession } from "../lib/session";
import {
  readPendingLive,
  clientMeta,
  bumpFailure,
  resetFailure,
} from "./adminAuth";
import { writeAdminAudit } from "../lib/adminAudit";

export const adminWebauthn = new Hono<AppEnv>();

const CHAL_TTL_SEC = 5 * 60;
const RP_NAME = "AfterLife Admin";

function chalKey(adminId: number, purpose: "reg" | "auth"): string {
  return `wa:chal:${adminId}:${purpose}`;
}

function adminUserHandle(id: number): Uint8Array {
  return isoUint8Array.fromUTF8String(`admin:${id}`);
}

adminWebauthn.post("/webauthn/register/begin", async (c) => {
  const pending = await readPendingLive(c);

  const row = await c.env.DB.prepare(
    `SELECT webauthn_credential_id FROM admin_users WHERE id = ?`,
  )
    .bind(pending.sub)
    .first<{ webauthn_credential_id: string | null }>();

  const opts = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: c.env.WEBAUTHN_RP_ID,
    userName: pending.email,
    userID: adminUserHandle(pending.sub) as never,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: row?.webauthn_credential_id
      ? [{ id: row.webauthn_credential_id, transports: ["usb", "nfc", "ble", "internal"] }]
      : [],
  });

  await c.env.KV_AUTH.put(chalKey(pending.sub, "reg"), opts.challenge, {
    expirationTtl: CHAL_TTL_SEC,
  });
  return c.json(opts);
});

const regFinishSchema = z.object({
  response: z
    .object({
      id: z.string(),
      rawId: z.string(),
      type: z.string(),
      response: z
        .object({
          attestationObject: z.string(),
          clientDataJSON: z.string(),
          transports: z.array(z.string()).optional(),
        })
        .passthrough(),
      clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
      authenticatorAttachment: z.string().optional(),
    })
    .passthrough(),
});

adminWebauthn.post("/webauthn/register/finish", async (c) => {
  const pending = await readPendingLive(c);
  const body = await parseJson(c, regFinishSchema);

  const expected = await c.env.KV_AUTH.get(chalKey(pending.sub, "reg"));
  if (!expected) throw new APIError("WEBAUTHN_CHALLENGE_EXPIRED", "Challenge expired or unknown.");

  let verified: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
  try {
    verified = await verifyRegistrationResponse({
      response: body.response as never,
      expectedChallenge: expected,
      expectedOrigin: c.env.WEBAUTHN_RP_ORIGIN,
      expectedRPID: c.env.WEBAUTHN_RP_ID,
    });
  } catch (err) {
    await c.env.KV_AUTH.delete(chalKey(pending.sub, "reg"));
    throw new APIError("WEBAUTHN_INVALID", (err as Error).message);
  }
  await c.env.KV_AUTH.delete(chalKey(pending.sub, "reg"));

  if (!verified.verified || !verified.registrationInfo) {
    throw new APIError("WEBAUTHN_INVALID", "Registration verification failed.");
  }
  const cred = verified.registrationInfo.credential;

  await c.env.DB.prepare(
    `UPDATE admin_users
        SET webauthn_credential_id = ?,
            webauthn_public_key = ?,
            webauthn_sign_count = ?,
            requires_webauthn = CASE WHEN role = 'super_admin' THEN 1 ELSE requires_webauthn END
      WHERE id = ?`,
  )
    .bind(cred.id, isoBase64URL.fromBuffer(cred.publicKey), cred.counter, pending.sub)
    .run();

  const meta = clientMeta(c);
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: pending.sub,
    action: "auth.webauthn.register",
    targetType: "admin_user",
    targetId: String(pending.sub),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return c.json({ ok: true, credentialId: cred.id }, 201);
});

adminWebauthn.post("/webauthn/login/begin", async (c) => {
  const pending = await readPendingLive(c);
  const row = await c.env.DB.prepare(
    `SELECT webauthn_credential_id FROM admin_users WHERE id = ?`,
  )
    .bind(pending.sub)
    .first<{ webauthn_credential_id: string | null }>();
  if (!row?.webauthn_credential_id) {
    throw new APIError("WEBAUTHN_NOT_ENROLLED", "WebAuthn credential not registered.");
  }
  const opts = await generateAuthenticationOptions({
    rpID: c.env.WEBAUTHN_RP_ID,
    userVerification: "preferred",
    allowCredentials: [
      { id: row.webauthn_credential_id, transports: ["usb", "nfc", "ble", "internal"] },
    ],
  });
  await c.env.KV_AUTH.put(chalKey(pending.sub, "auth"), opts.challenge, {
    expirationTtl: CHAL_TTL_SEC,
  });
  return c.json(opts);
});

const loginFinishSchema = z.object({
  response: z
    .object({
      id: z.string(),
      rawId: z.string(),
      type: z.string(),
      response: z
        .object({
          authenticatorData: z.string(),
          clientDataJSON: z.string(),
          signature: z.string(),
          userHandle: z.string().optional(),
        })
        .passthrough(),
      clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
    })
    .passthrough(),
});

adminWebauthn.post("/webauthn/login/finish", async (c) => {
  const pending = await readPendingLive(c);
  const body = await parseJson(c, loginFinishSchema);

  const expected = await c.env.KV_AUTH.get(chalKey(pending.sub, "auth"));
  if (!expected) throw new APIError("WEBAUTHN_CHALLENGE_EXPIRED", "Challenge expired or unknown.");

  const row = await c.env.DB.prepare(
    `SELECT webauthn_credential_id, webauthn_public_key, webauthn_sign_count
       FROM admin_users WHERE id = ?`,
  )
    .bind(pending.sub)
    .first<{
      webauthn_credential_id: string | null;
      webauthn_public_key: string | null;
      webauthn_sign_count: number;
    }>();
  if (!row?.webauthn_credential_id || !row.webauthn_public_key) {
    throw new APIError("WEBAUTHN_NOT_ENROLLED", "No credential.");
  }

  let verified: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
  try {
    verified = await verifyAuthenticationResponse({
      response: body.response as never,
      expectedChallenge: expected,
      expectedOrigin: c.env.WEBAUTHN_RP_ORIGIN,
      expectedRPID: c.env.WEBAUTHN_RP_ID,
      credential: {
        id: row.webauthn_credential_id,
        publicKey: isoBase64URL.toBuffer(row.webauthn_public_key),
        counter: row.webauthn_sign_count,
      },
    });
  } catch (err) {
    await c.env.KV_AUTH.delete(chalKey(pending.sub, "auth"));
    await bumpFailure(c.env.DB, pending.sub);
    const meta0 = clientMeta(c);
    await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
      adminUserId: pending.sub,
      action: "auth.webauthn.verify.fail",
      reason: (err as Error).message,
      ip: meta0.ip,
      userAgent: meta0.userAgent,
    });
    throw new APIError("WEBAUTHN_INVALID", (err as Error).message);
  }
  await c.env.KV_AUTH.delete(chalKey(pending.sub, "auth"));
  if (!verified.verified) {
    await bumpFailure(c.env.DB, pending.sub);
    throw new APIError("WEBAUTHN_INVALID", "Verification failed.");
  }

  await c.env.DB.prepare(
    `UPDATE admin_users SET webauthn_sign_count = ? WHERE id = ?`,
  )
    .bind(verified.authenticationInfo.newCounter, pending.sub)
    .run();
  await resetFailure(c.env.DB, pending.sub);

  const tokens = await issueSession(c, pending.sub, undefined, true);
  const meta = clientMeta(c);
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: pending.sub,
    action: "auth.webauthn.verify.success",
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return c.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessExpiresIn: tokens.accessExpiresIn,
    admin: { id: pending.sub, email: pending.email, role: pending.role },
  });
});
