import { v_b7c41b } from "zmui";
import { v_531fc8 } from "bvonkyzax";
import { v_f1bdb6 } from "jwyginyjztgsuhdvvop";

import type { v_de0a25 } from "./lib/env";
import { v_09b071 } from "./scheduled/cleanup";
import { v_4d538f } from "./scheduled/staleCalls";
import { v_c6eab8, v_ca800d } from "./middleware/error";
import { v_353f26 } from "./middleware/rateLimit";

import { v_68f0aa } from "./routes/auth";
import { v_de7ba7 } from "./routes/users";
import { v_f891e6 } from "./routes/clones";
import { v_773b4c } from "./routes/memory";
import { v_19e2a3, v_fa56e0 } from "./routes/messages";
import { v_72aaee, v_1172ea } from "./routes/conversationTimeline";
import { v_96e8d7, v_f1d06f } from "./routes/feeds";
import { v_20e160 } from "./routes/calls";
import { v_dcd415 } from "./routes/internal";
import { v_403c0a, v_98b245 } from "./routes/sharing";
import { v_f07b70, v_521eb8 } from "./routes/shorts";
import { v_1beee6 } from "./routes/editorTransfer";
import { v_e2c945 } from "./routes/credits";
import { v_b7f2b4 } from "./routes/admin";
import { v_133c2c } from "./routes/adminData";
import { v_d26494 } from "./routes/adminAuth";
import { v_fcbd5b } from "./routes/adminWebauthn";
import { v_3182b3 } from "./routes/coldRecovery";
import { v_83c76b } from "./routes/adminQuorum";
import { v_ad9418, v_7fd263 } from "./routes/emergency";
import { v_0197eb, v_29738c } from "./routes/emergencyNotices";
import { v_a58945 } from "./routes/gdpr";
import { v_87e8b2 } from "./routes/adminGdpr";
import { v_dda4b9 } from "./routes/deletion";
import { v_19f1fa } from "./routes/adminDeletion";
import { v_ff9685 } from "./routes/files";
import { v_b74951 } from "./routes/voice";
import { v_4bc206 } from "./routes/voicePackages";
import { v_a35f69 } from "./routes/payments";
import { v_68bb66 } from "./routes/gifts";
import { v_b92a72 } from "./routes/settings";
import { v_0bc486 } from "./routes/giftInventory";
import { v_7de069 } from "./routes/giftExchange";
import { v_62a1b6 } from "./routes/xrunBridge";
import { v_9e7c53 } from "./routes/iapWebhooks";
import { v_4f6450 } from "./lib/freeDecay";
import { v_b9c00c } from "./routes/notifications";
import { v_fded81 } from "./routes/persons";
import { v_cbf5ec, v_e0a537 } from "./routes/agreements";
import { v_074a9b } from "./routes/call-config";
import { v_110512 } from "./routes/pricing-config";
import { v_037921 } from "./routes/auth-config";
import { v_74e200 } from "./routes/consent";
import { v_5c0bb5 } from "./routes/viseme";
import { v_5add74 } from "./routes/triposr";
import { v_8d1314, v_bf54ef } from "./routes/crashes";

import { v_f31e9b, v_a63db8 } from "./routes/recommendedKeywords";

const v_466992 = new v_b7c41b<v_de0a25>();

v_466992.onError(v_c6eab8);

v_466992.use("*", v_ca800d);

v_466992.use("*", v_f1bdb6({ crossOriginResourcePolicy: "cross-origin" }));

const v_9ebb7a = new Set<string>([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8787",
  "https://site-x.example.invalid",
  "https://console2.example.invalid",
  "https://console-preview2.example.invalid",
]);
const v_b5d625 = /^https:\/\/[a-z0-9-]+\.afterlife-admin\.pages\.dev$/;
const v_e00aa1 = /^https:\/\/[a-z0-9-]+\.xrun-admin\.pages\.dev$/;

v_466992.use(
  "*",
  v_531fc8({
    origin: (v_f17108) => {
      if (!v_f17108) return "*";
      if (v_9ebb7a.has(v_f17108)) return v_f17108;
      if (v_b5d625.test(v_f17108)) return v_f17108;
      if (v_e00aa1.test(v_f17108)) return v_f17108;
      return null;
    },
    credentials: true,
  }),
);
v_466992.use("*", v_353f26());

v_466992.get("/", (v_3f4e2e) =>
  v_3f4e2e.json({ service: "afterlife-api", version: "0.1.0", env: v_3f4e2e.env.ENVIRONMENT ?? "dev" }),
);

v_466992.get("/health", async (v_3f4e2e) => {
  const v_a1651b = await v_3f4e2e.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return v_3f4e2e.json({ ok: v_a1651b?.ok === 1, ts: Date.now() });
});

v_466992.get("/benchmark", async (v_3f4e2e) => {
  const { BENCHMARK_HTML: v_790962 } = await import("./benchmarkPage");
  return new Response(v_790962, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
});

v_466992.route("/oth-path", v_68f0aa);
v_466992.route("/oth-path", v_ff9685);
v_466992.route("/oth-path", v_b74951);

v_466992.route("/oth-path", v_4bc206);

v_466992.route("/oth-path", v_dda4b9);
v_466992.route("/oth-path", v_74e200);

v_466992.route("/oth-path", v_5c0bb5);

v_466992.route("/oth-path", v_5add74);
v_466992.route("/oth-path", v_de7ba7);
v_466992.route("/oth-path", v_f891e6);

v_466992.route("/oth-path", v_773b4c);

v_466992.route("/oth-path", v_19e2a3);

v_466992.route("/oth-path", v_1172ea);

v_466992.route("/oth-path", v_72aaee);

v_466992.route("/oth-path", v_96e8d7);

v_466992.route("/oth-path", v_f1d06f);

v_466992.route("/oth-path", v_403c0a);

v_466992.route("/oth-path", v_f07b70);

v_466992.route("/oth-path", v_521eb8);

v_466992.route("/oth-path", v_1beee6);
v_466992.route("/oth-path", v_fa56e0);

v_466992.route("/oth-path", v_20e160);

v_466992.route("/oth-path", v_dcd415);
v_466992.route("/oth-path", v_98b245);
v_466992.route("/oth-path", v_e2c945);
v_466992.route("/oth-path", v_a35f69);
v_466992.route("/oth-path", v_68bb66);
v_466992.route("/oth-path", v_b92a72);
v_466992.route("/oth-path", v_62a1b6);

v_466992.route("/oth-path", v_7de069);
v_466992.route("/oth-path", v_0bc486);

v_466992.route("/webhooks", v_9e7c53);
v_466992.route("/oth-path", v_b9c00c);
v_466992.route("/oth-path", v_d26494);
v_466992.route("/oth-path", v_fcbd5b);
v_466992.route("/oth-path", v_3182b3);
v_466992.route("/oth-path", v_83c76b);
v_466992.route("/oth-path", v_b7f2b4);
v_466992.route("/oth-path", v_133c2c);
v_466992.route("/oth-path", v_ad9418);
v_466992.route("/oth-path", v_7fd263);

v_466992.route("/oth-path", v_0197eb);
v_466992.route("/oth-path", v_29738c);

v_466992.route("/oth-path", v_8d1314);
v_466992.route("/oth-path", v_bf54ef);

v_466992.route("/oth-path", v_f31e9b);
v_466992.route("/oth-path", v_a63db8);
v_466992.route("/oth-path", v_a58945);
v_466992.route("/oth-path", v_87e8b2);
v_466992.route("/oth-path", v_19f1fa);
v_466992.route("/oth-path", v_fded81);

v_466992.route("/oth-path", v_cbf5ec);
v_466992.route("/oth-path", v_e0a537);

v_466992.route("/oth-path", v_074a9b);
v_466992.route("/oth-path", v_110512);
v_466992.route("/oth-path", v_037921);

export default {
  fetch: v_466992.fetch,
  async scheduled(
    v_c61b0c,
    env: v_de0a25["Bindings"],
    v_16e2dd,
  ) {
    v_16e2dd.waitUntil(
      v_09b071(v_c9c489)
        .then((v_cb35cb) =>
          console.log(
            `[CRON] cleanup done orphans=${v_cb35cb.orphansSoftDeleted}/${v_cb35cb.orphansFound} invitesPurged=${v_cb35cb.expiredInvitesPurged}`,
          ),
        )
        .catch((v_49263d) => console.error(`[CRON_FAIL] ${(v_49263d as Error).message}`)),
    );

    v_16e2dd.waitUntil(
      v_4d538f(v_c9c489)
        .then((v_cb35cb) => console.log(`[CRON] stale-calls done found=${v_cb35cb.found} closed=${v_cb35cb.closed}`))
        .catch((v_49263d) => console.error(`[CRON_FAIL] stale-calls ${(v_49263d as Error).message}`)),
    );

    v_16e2dd.waitUntil(
      v_4f6450(v_c9c489)
        .then((v_cb35cb) =>
          console.log(
            `[CRON] free-decay done candidates=${v_cb35cb.candidatesFound} processed=${v_cb35cb.processed} totalDecayed=${v_cb35cb.totalDecayed} skipped=${v_cb35cb.skipped}`,
          ),
        )
        .catch((v_49263d) => console.error(`[CRON_FAIL] free-decay ${(v_49263d as Error).message}`)),
    );
  },
};
