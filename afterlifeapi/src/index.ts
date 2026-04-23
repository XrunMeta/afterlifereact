import { v_b7c41b } from "zmui";
import { v_531fc8 } from "bvonkyzax";
import { v_f1bdb6 } from "jwyginyjztgsuhdvvop";

import type { v_de0a25 } from "./lib/env";
import { v_09b071 } from "./scheduled/cleanup";
import { v_c6eab8, v_ca800d } from "./middleware/error";
import { v_353f26 } from "./middleware/rateLimit";

import { v_68f0aa } from "./routes/auth";
import { v_de7ba7 } from "./routes/users";
import { v_f891e6 } from "./routes/clones";
import { v_773b4c } from "./routes/memory";
import { v_19e2a3, v_fa56e0 } from "./routes/messages";
import { v_96e8d7 } from "./routes/feeds";
import { v_b211dd } from "./routes/sessions";
import { v_403c0a, v_98b245 } from "./routes/sharing";
import { v_f07b70 } from "./routes/shorts";
import { v_e2c945 } from "./routes/credits";
import { v_b7f2b4 } from "./routes/admin";
import { v_d8985c } from "./routes/adminPreview";
import { v_d26494 } from "./routes/adminAuth";
import { v_fcbd5b } from "./routes/adminWebauthn";
import { v_3182b3 } from "./routes/coldRecovery";
import { v_83c76b } from "./routes/adminQuorum";
import { v_ad9418, v_7fd263 } from "./routes/emergency";
import { v_a58945 } from "./routes/gdpr";
import { v_87e8b2 } from "./routes/adminGdpr";
import { v_dda4b9 } from "./routes/deletion";
import { v_19f1fa } from "./routes/adminDeletion";

const v_466992 = new v_b7c41b<v_de0a25>();

v_466992.onError(v_c6eab8);

v_466992.use("*", v_ca800d);
v_466992.use("*", v_f1bdb6());
v_466992.use("*", v_531fc8({ origin: (v_b6c474) => v_b6c474 ?? "*", credentials: true }));
v_466992.use("*", v_353f26());

v_466992.get("/", (v_3f4e2e) =>
  v_3f4e2e.json({ service: "afterlife-api", version: "0.1.0", env: v_3f4e2e.env.ENVIRONMENT ?? "dev" }),
);

v_466992.get("/health", async (v_3f4e2e) => {
  const v_a1651b = await v_3f4e2e.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return v_3f4e2e.json({ ok: v_a1651b?.ok === 1, ts: Date.now() });
});

v_466992.route("/oth-path", v_68f0aa);

v_466992.route("/oth-path", v_dda4b9);
v_466992.route("/oth-path", v_de7ba7);
v_466992.route("/oth-path", v_f891e6);

v_466992.route("/oth-path", v_773b4c);

v_466992.route("/oth-path", v_19e2a3);

v_466992.route("/oth-path", v_96e8d7);

v_466992.route("/oth-path", v_403c0a);

v_466992.route("/oth-path", v_f07b70);
v_466992.route("/oth-path", v_fa56e0);

v_466992.route("/oth-path", v_b211dd);
v_466992.route("/oth-path", v_98b245);
v_466992.route("/oth-path", v_e2c945);
v_466992.route("/oth-path", v_d26494);
v_466992.route("/oth-path", v_fcbd5b);
v_466992.route("/oth-path", v_3182b3);
v_466992.route("/oth-path", v_83c76b);
v_466992.route("/oth-path", v_b7f2b4);
v_466992.route("/oth-path", v_d8985c);
v_466992.route("/oth-path", v_ad9418);
v_466992.route("/oth-path", v_7fd263);
v_466992.route("/oth-path", v_a58945);
v_466992.route("/oth-path", v_87e8b2);
v_466992.route("/oth-path", v_19f1fa);

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
  },
};
