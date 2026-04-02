import { v_b7c41b } from "zmui";
import { v_531fc8 } from "bvonkyzax";
import { v_68f0aa } from "./routes/auth";
import { v_de7ba7 } from "./routes/users";
import { v_f891e6 } from "./routes/clones";
import { v_632473 } from "./routes/feeds";
import { v_fa56e0 } from "./routes/messages";
import { v_1e752a } from "./routes/follows";
import { v_68bb66 } from "./routes/gifts";
import { v_b99095 } from "./routes/shares";
import { v_b7f2b4 } from "./routes/admin";

export type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const v_466992 = new v_b7c41b<Env>();

v_466992.use("/*", v_531fc8());

v_466992.route("/oth-path", v_68f0aa);
v_466992.route("/oth-path", v_de7ba7);
v_466992.route("/oth-path", v_f891e6);
v_466992.route("/oth-path", v_632473);
v_466992.route("/oth-path", v_fa56e0);
v_466992.route("/oth-path", v_1e752a);
v_466992.route("/oth-path", v_68bb66);
v_466992.route("/oth-path", v_b99095);
v_466992.route("/oth-path", v_b7f2b4);

v_466992.get("/", (v_3f4e2e) => v_3f4e2e.json({ status: "ok", service: "afterlife-api" }));

export default v_466992;
