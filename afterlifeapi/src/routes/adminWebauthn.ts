

import { v_b7c41b } from "zmui";
import {
  v_11ace6,
  v_877aea,
  v_d50a52,
  v_365a4b,
} from "gygbttvwcppngdjpszkpwz";
import { v_94640c, v_5296eb } from "qvtsteqkyuhrhnmoxlklmektbyxskf";

import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_8ab5ff } from "../lib/session";
import {
  v_8bde96,
  v_0dd6a5,
  v_767d31,
  v_03aa46,
} from "./adminAuth";
import { v_1cb5cc } from "../lib/adminAudit";

export const v_fcbd5b = new v_b7c41b<v_de0a25>();

const v_10f4cf = 5 * 60;
const v_d31779 = "AfterLife Admin";

function v_f3bd41(v_db9be1, v_fa63e0): string {
  return `wa:chal:${v_db9be1}:${v_fa63e0}`;
}

function v_00d628(v_389afb): Uint8Array {
  return v_5296eb.fromUTF8String(`admin:${v_389afb}`);
}

v_fcbd5b.post("/webauthn/register/begin", async (v_3f4e2e) => {
  const v_483de2 = await v_8bde96(v_3f4e2e);

  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT webauthn_credential_id FROM admin_users WHERE id = ?`,
  )
    .bind(v_483de2.sub)
    .first<{ webauthn_credential_id: string | null }>();

  const v_328259 = await v_11ace6({
    rpName: v_d31779,
    rpID: v_3f4e2e.env.WEBAUTHN_RP_ID,
    userName: v_483de2.email,
    userID: v_00d628(v_483de2.sub) as never,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: v_3ac7e7?.webauthn_credential_id
      ? [{ id: v_3ac7e7.webauthn_credential_id, transports: ["usb", "nfc", "ble", "internal"] }]
      : [],
  });

  await v_3f4e2e.env.KV_AUTH.put(v_f3bd41(v_483de2.sub, "reg"), v_328259.challenge, {
    expirationTtl: v_10f4cf,
  });
  return v_3f4e2e.json(v_328259);
});

const v_3767cf = v_1f4ea7.object({
  response: v_1f4ea7
    .object({
      id: v_1f4ea7.string(),
      rawId: v_1f4ea7.string(),
      type: v_1f4ea7.string(),
      response: v_1f4ea7
        .object({
          attestationObject: v_1f4ea7.string(),
          clientDataJSON: v_1f4ea7.string(),
          transports: v_1f4ea7.array(v_1f4ea7.string()).optional(),
        })
        .passthrough(),
      clientExtensionResults: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.unknown()).optional(),
      authenticatorAttachment: v_1f4ea7.string().optional(),
    })
    .passthrough(),
});

v_fcbd5b.post("/webauthn/register/finish", async (v_3f4e2e) => {
  const v_483de2 = await v_8bde96(v_3f4e2e);
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_3767cf);

  const v_505a6d = await v_3f4e2e.env.KV_AUTH.get(v_f3bd41(v_483de2.sub, "reg"));
  if (!v_505a6d) throw new v_3ebe58("WEBAUTHN_CHALLENGE_EXPIRED", "Challenge expired or unknown.");

  let verified: Awaited<ReturnType<typeof v_877aea>>;
  try {
    v_6dadb1 = await v_877aea({
      response: v_4d33b2.response as never,
      expectedChallenge: v_505a6d,
      expectedOrigin: v_3f4e2e.env.WEBAUTHN_RP_ORIGIN,
      expectedRPID: v_3f4e2e.env.WEBAUTHN_RP_ID,
    });
  } catch (v_49263d) {
    await v_3f4e2e.env.KV_AUTH.delete(v_f3bd41(v_483de2.sub, "reg"));
    throw new v_3ebe58("WEBAUTHN_INVALID", (v_49263d as Error).message);
  }
  await v_3f4e2e.env.KV_AUTH.delete(v_f3bd41(v_483de2.sub, "reg"));

  if (!v_6dadb1.verified || !v_6dadb1.registrationInfo) {
    throw new v_3ebe58("WEBAUTHN_INVALID", "Registration verification failed.");
  }
  const v_e6f3e7 = v_6dadb1.registrationInfo.credential;

  await v_3f4e2e.env.DB.prepare(
    `UPDATE admin_users
        SET webauthn_credential_id = ?,
            webauthn_public_key = ?,
            webauthn_sign_count = ?,
            requires_webauthn = CASE WHEN role = 'super_admin' THEN 1 ELSE requires_webauthn END
      WHERE id = ?`,
  )
    .bind(v_e6f3e7.id, v_94640c.fromBuffer(v_e6f3e7.publicKey), v_e6f3e7.counter, v_483de2.sub)
    .run();

  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: v_483de2.sub,
    action: "auth.webauthn.register",
    targetType: "admin_user",
    targetId: String(v_483de2.sub),
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });
  return v_3f4e2e.json({ ok: true, credentialId: v_e6f3e7.id }, 201);
});

v_fcbd5b.post("/webauthn/login/begin", async (v_3f4e2e) => {
  const v_483de2 = await v_8bde96(v_3f4e2e);
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT webauthn_credential_id FROM admin_users WHERE id = ?`,
  )
    .bind(v_483de2.sub)
    .first<{ webauthn_credential_id: string | null }>();
  if (!v_3ac7e7?.webauthn_credential_id) {
    throw new v_3ebe58("WEBAUTHN_NOT_ENROLLED", "WebAuthn credential not registered.");
  }
  const v_328259 = await v_d50a52({
    rpID: v_3f4e2e.env.WEBAUTHN_RP_ID,
    userVerification: "preferred",
    allowCredentials: [
      { id: v_3ac7e7.webauthn_credential_id, transports: ["usb", "nfc", "ble", "internal"] },
    ],
  });
  await v_3f4e2e.env.KV_AUTH.put(v_f3bd41(v_483de2.sub, "auth"), v_328259.challenge, {
    expirationTtl: v_10f4cf,
  });
  return v_3f4e2e.json(v_328259);
});

const v_fe22f4 = v_1f4ea7.object({
  response: v_1f4ea7
    .object({
      id: v_1f4ea7.string(),
      rawId: v_1f4ea7.string(),
      type: v_1f4ea7.string(),
      response: v_1f4ea7
        .object({
          authenticatorData: v_1f4ea7.string(),
          clientDataJSON: v_1f4ea7.string(),
          signature: v_1f4ea7.string(),
          userHandle: v_1f4ea7.string().optional(),
        })
        .passthrough(),
      clientExtensionResults: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.unknown()).optional(),
    })
    .passthrough(),
});

v_fcbd5b.post("/webauthn/login/finish", async (v_3f4e2e) => {
  const v_483de2 = await v_8bde96(v_3f4e2e);
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_fe22f4);

  const v_505a6d = await v_3f4e2e.env.KV_AUTH.get(v_f3bd41(v_483de2.sub, "auth"));
  if (!v_505a6d) throw new v_3ebe58("WEBAUTHN_CHALLENGE_EXPIRED", "Challenge expired or unknown.");

  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT webauthn_credential_id, webauthn_public_key, webauthn_sign_count
       FROM admin_users WHERE id = ?`,
  )
    .bind(v_483de2.sub)
    .first<{
      webauthn_credential_id: string | null;
      webauthn_public_key: string | null;
      webauthn_sign_count: number;
    }>();
  if (!v_3ac7e7?.webauthn_credential_id || !v_3ac7e7.webauthn_public_key) {
    throw new v_3ebe58("WEBAUTHN_NOT_ENROLLED", "No credential.");
  }

  let verified: Awaited<ReturnType<typeof v_365a4b>>;
  try {
    v_6dadb1 = await v_365a4b({
      response: v_4d33b2.response as never,
      expectedChallenge: v_505a6d,
      expectedOrigin: v_3f4e2e.env.WEBAUTHN_RP_ORIGIN,
      expectedRPID: v_3f4e2e.env.WEBAUTHN_RP_ID,
      credential: {
        id: v_3ac7e7.webauthn_credential_id,
        publicKey: v_94640c.toBuffer(v_3ac7e7.webauthn_public_key),
        counter: v_3ac7e7.webauthn_sign_count,
      },
    });
  } catch (v_49263d) {
    await v_3f4e2e.env.KV_AUTH.delete(v_f3bd41(v_483de2.sub, "auth"));
    await v_767d31(v_3f4e2e.env.DB, v_483de2.sub);
    const v_bf0f01 = v_0dd6a5(v_3f4e2e);
    await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
      adminUserId: v_483de2.sub,
      action: "auth.webauthn.verify.fail",
      reason: (v_49263d as Error).message,
      ip: v_bf0f01.ip,
      userAgent: v_bf0f01.userAgent,
    });
    throw new v_3ebe58("WEBAUTHN_INVALID", (v_49263d as Error).message);
  }
  await v_3f4e2e.env.KV_AUTH.delete(v_f3bd41(v_483de2.sub, "auth"));
  if (!v_6dadb1.verified) {
    await v_767d31(v_3f4e2e.env.DB, v_483de2.sub);
    throw new v_3ebe58("WEBAUTHN_INVALID", "Verification failed.");
  }

  await v_3f4e2e.env.DB.prepare(
    `UPDATE admin_users SET webauthn_sign_count = ? WHERE id = ?`,
  )
    .bind(v_6dadb1.authenticationInfo.newCounter, v_483de2.sub)
    .run();
  await v_03aa46(v_3f4e2e.env.DB, v_483de2.sub);

  const v_ef86b6 = await v_8ab5ff(v_3f4e2e, v_483de2.sub, undefined, true);
  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: v_483de2.sub,
    action: "auth.webauthn.verify.success",
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });
  return v_3f4e2e.json({
    accessToken: v_ef86b6.accessToken,
    refreshToken: v_ef86b6.refreshToken,
    accessExpiresIn: v_ef86b6.accessExpiresIn,
    admin: { id: v_483de2.sub, email: v_483de2.email, role: v_483de2.role },
  });
});
