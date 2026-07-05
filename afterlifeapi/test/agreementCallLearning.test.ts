import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298 } from "lwkoweqmjbnvjqw";

interface AgreementRow {
  type: number;
  language: string;
  content: string;
  updated_at: number;
  updated_by: string | null;
}

v_469bf2("Agreements type 5 (통화 학습)", () => {
  v_23805a("GET /oth-path?type=5&lang=ko → 통화 학습 약관 반환", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path?type=5&lang=ko");
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = await v_8f00b9.json<{ data: AgreementRow | null }>();
    v_4d37e3(v_7ecfd1.data).not.toBeNull();
    v_4d37e3(v_7ecfd1.data?.type).toBe(5);
    v_4d37e3(v_7ecfd1.data?.content).toContain("통화");
  });
});
