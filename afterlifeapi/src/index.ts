import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./routes/auth";
import { users } from "./routes/users";
import { clones } from "./routes/clones";
import { feeds } from "./routes/feeds";
import { messages } from "./routes/messages";
import { follows } from "./routes/follows";
import { gifts } from "./routes/gifts";
import { shares } from "./routes/shares";
import { admin } from "./routes/admin";

export type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const app = new Hono<Env>();

app.use("/*", cors());

app.route("/oth-path", auth);
app.route("/oth-path", users);
app.route("/oth-path", clones);
app.route("/oth-path", feeds);
app.route("/oth-path", messages);
app.route("/oth-path", follows);
app.route("/oth-path", gifts);
app.route("/oth-path", shares);
app.route("/oth-path", admin);

app.get("/", (c) => c.json({ status: "ok", service: "afterlife-api" }));

export default app;
