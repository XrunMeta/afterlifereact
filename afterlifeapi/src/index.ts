import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import type { AppEnv } from "./lib/env";
import { runCleanup } from "./scheduled/cleanup";
import { onError, requestId } from "./middleware/error";
import { rateLimit } from "./middleware/rateLimit";

import { auth } from "./routes/auth";
import { users } from "./routes/users";
import { clones } from "./routes/clones";
import { memory } from "./routes/memory";
import { cloneMessages, messages } from "./routes/messages";
import { cloneShares, inviteTokens } from "./routes/sharing";
import { credits } from "./routes/credits";
import { admin } from "./routes/admin";
import { adminAuth } from "./routes/adminAuth";
import { adminWebauthn } from "./routes/adminWebauthn";
import { coldRecovery } from "./routes/coldRecovery";
import { adminQuorum } from "./routes/adminQuorum";
import { emergency, inheritance } from "./routes/emergency";
import { gdpr } from "./routes/gdpr";

const app = new Hono<AppEnv>();

app.onError(onError);

app.use("*", requestId);
app.use("*", secureHeaders());
app.use("*", cors({ origin: (o) => o ?? "*", credentials: true }));
app.use("*", rateLimit());

app.get("/", (c) =>
  c.json({ service: "afterlife-api", version: "0.1.0", env: c.env.ENVIRONMENT ?? "dev" }),
);

app.get("/health", async (c) => {
  const db = await c.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return c.json({ ok: db?.ok === 1, ts: Date.now() });
});

app.route("/oth-path", auth);
app.route("/oth-path", users);
app.route("/oth-path", clones);

app.route("/oth-path", memory);

app.route("/oth-path", cloneMessages);

app.route("/oth-path", cloneShares);
app.route("/oth-path", messages);
app.route("/oth-path", inviteTokens);
app.route("/oth-path", credits);
app.route("/oth-path", adminAuth);
app.route("/oth-path", adminWebauthn);
app.route("/oth-path", coldRecovery);
app.route("/oth-path", adminQuorum);
app.route("/oth-path", admin);
app.route("/oth-path", emergency);
app.route("/oth-path", inheritance);
app.route("/oth-path", gdpr);

export default {
  fetch: app.fetch,
  async scheduled(
    _event: ScheduledEvent,
    env: AppEnv["Bindings"],
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      runCleanup(env)
        .then((r) =>
          console.log(
            `[CRON] cleanup done orphans=${r.orphansSoftDeleted}/${r.orphansFound} invitesPurged=${r.expiredInvitesPurged}`,
          ),
        )
        .catch((err) => console.error(`[CRON_FAIL] ${(err as Error).message}`)),
    );
  },
};
