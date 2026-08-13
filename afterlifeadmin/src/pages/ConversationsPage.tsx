

import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";

const v_93c199 = "oth-user@example.invalid";

interface Turn {
  ts: number;
  input: string;
  answer: string;
  meta: Record<string, unknown>;
}

interface CloneWithRecords {
  id: number;
  name: string;
  created_at: string;
  items: Turn[];
  count?: number;
  error?: string;
}

export default function v_5bca36() {
  const [v_e0c7e8, v_fedf34] = v_5ab095(v_93c199);
  const [v_683210, v_34a50a] = v_5ab095(false);
  const [v_49263d, v_8a5996] = v_5ab095<string | null>(null);
  const [v_43e90c, v_688dd2] = v_5ab095<number | null>(null);
  const [v_f891e6, v_3302bc] = v_5ab095<CloneWithRecords[]>([]);
  const [v_8307be, v_3fbfa4] = v_5ab095<number | null>(null);

  const v_f6f5de = () => {
    v_34a50a(true);
    v_8a5996(null);
    v_05a921.getConversations(v_e0c7e8)
      .then((v_8f00b9) => {
        v_688dd2(v_8f00b9.user_id);
        v_3302bc(v_8f00b9.clones);
        if (v_8f00b9.clones.length > 0 && v_8307be === null) {
          v_3fbfa4(v_8f00b9.clones[0].id);
        }
      })
      .catch((v_9e86fd) => v_8a5996(String(v_9e86fd)))
      .finally(() => v_34a50a(false));
  };

  v_c4deb2(() => {
    v_f6f5de();

  }, []);

  const v_587413 = v_f891e6.find((v_3f4e2e) => v_3f4e2e.id === v_8307be);

  return (
    <div style={{ padding: 20, color: "#e5e7eb", background: "#0a0a0b", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>통화 대화 조회</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={v_e0c7e8}
          onChange={(v_9e86fd) => v_fedf34(v_9e86fd.target.value)}
          placeholder="user_email"
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 6,
            color: "#e5e7eb",
          }}
        />
        <button
          onClick={v_f6f5de}
          disabled={v_683210}
          style={{
            padding: "8px 16px",
            background: "#2563eb",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            cursor: "pointer",
            opacity: v_683210 ? 0.5 : 1,
          }}
        >
          {v_683210 ? "조회 중…" : "조회"}
        </button>
      </div>

      {v_49263d && <div style={{ color: "#f87171", marginBottom: 12 }}>오류: {v_49263d}</div>}
      {v_43e90c != null && <div style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 12 }}>user_id: {v_43e90c} · clones: {v_f891e6.length}</div>}
      {v_43e90c === null && !v_683210 && !v_49263d && <div style={{ color: "#a1a1aa" }}>해당 이메일 사용자 없음.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
        {}
        <div style={{ background: "#18181b", borderRadius: 8, padding: 8, maxHeight: "80vh", overflowY: "auto" }}>
          {v_f891e6.map((v_3f4e2e) => {
            const v_f8b770 = v_3f4e2e.id === v_8307be;
            return (
              <div
                key={v_3f4e2e.id}
                onClick={() => v_3fbfa4(v_3f4e2e.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: v_f8b770 ? "#2563eb" : "transparent",
                  marginBottom: 4,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{v_3f4e2e.name} <span style={{ color: "#a1a1aa", fontWeight: 400 }}>#{v_3f4e2e.id}</span></div>
                <div style={{ fontSize: 11, color: v_f8b770 ? "#dbeafe" : "#a1a1aa", marginTop: 2 }}>
                  turn {v_3f4e2e.count ?? v_3f4e2e.items.length}
                  {v_3f4e2e.error ? ` · err: ${v_3f4e2e.error.slice(0, 40)}` : ""}
                </div>
              </div>
            );
          })}
        </div>

        {}
        <div style={{ background: "#18181b", borderRadius: 8, padding: 16, maxHeight: "80vh", overflowY: "auto" }}>
          {v_587413 ? (
            v_587413.items.length === 0 ? (
              <div style={{ color: "#a1a1aa" }}>대화 기록 없음.</div>
            ) : (
              v_587413.items.map((v_8d41d7) => {
                const v_f985e6 = new Date(v_8d41d7.ts).toLocaleString("ko-KR");

                const v_67b223 = () => {
                  const v_062ae9 = v_587413.id;
                  const v_9b6134 = v_8d41d7.answer || "";
                  navigator.clipboard?.writeText(v_9b6134).catch(() => {});
                  window.open("https://rtc.example.invalid/oth-path", "_blank");
                  window.alert(
                    `clone #${v_062ae9} 텍스트가 복사됐어. 새로 열린 탭에서 로그인 → 클론 선택(${v_062ae9}) → 텍스트 붙여넣고 ▶ 재생.`,
                  );
                };
                return (
                  <div key={v_8d41d7.ts} style={{ padding: "12px 0", borderBottom: "1px solid #27272a" }}>
                    <div style={{ fontSize: 11, color: "#71717a", marginBottom: 6 }}>{v_f985e6}</div>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ color: "#60a5fa", fontSize: 12, marginRight: 6 }}>사용자</span>
                      <span style={{ fontSize: 14 }}>{v_8d41d7.input || <i style={{ color: "#71717a" }}>(비어있음)</i>}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ color: "#a78bfa", fontSize: 12, marginRight: 6, whiteSpace: "nowrap" }}>클론</span>
                      <span style={{ fontSize: 14, flex: 1 }}>{v_8d41d7.answer || <i style={{ color: "#71717a" }}>(비어있음)</i>}</span>
                      {v_8d41d7.answer && (
                        <button
                          onClick={v_67b223}
                          title="verify-lab TTS 미리듣기 열기 (텍스트 복사됨)"
                          style={{
                            padding: "2px 8px",
                            background: "#3f3f46",
                            border: "1px solid #52525b",
                            borderRadius: 4,
                            color: "#e5e7eb",
                            fontSize: 11,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ▶ 듣기
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <div style={{ color: "#a1a1aa" }}>좌측에서 클론을 선택하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}
