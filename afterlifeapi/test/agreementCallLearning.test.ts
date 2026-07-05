import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

interface AgreementRow {
  type: number;
  language: string;
  content: string;
  updated_at: number;
  updated_by: string | null;
}

describe("Agreements type 5 (통화 학습)", () => {
  it("GET /oth-path?type=5&lang=ko → 통화 학습 약관 반환", async () => {
    const res = await SELF.fetch("http://localhost/oth-path?type=5&lang=ko");
    expect(res.status).toBe(200);
    const json = await res.json<{ data: AgreementRow | null }>();
    expect(json.data).not.toBeNull();
    expect(json.data?.type).toBe(5);
    expect(json.data?.content).toContain("통화");
  });
});
