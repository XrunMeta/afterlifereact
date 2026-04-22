import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("smoke", () => {
  it("GET / returns service info", async () => {
    const res = await SELF.fetch("http://localhost/");
    expect(res.status).toBe(200);
    const json = (await res.json()) as { service: string };
    expect(json.service).toBe("afterlife-api");
  });
});
