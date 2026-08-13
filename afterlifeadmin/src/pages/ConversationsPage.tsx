

import { v_c4deb2, v_5ab095, v_e662ae } from "bapkr";
import { v_05a921, v_22b25d } from "../api/client";

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
  const [v_52ff81, v_589039] = v_5ab095<number | null>(null);
  const v_f01ee0 = v_e662ae<HTMLAudioElement | null>(null);

  const v_830d22 = async (v_062ae9, v_3a5fef, v_9b6134) => {
    if (!v_9b6134.trim()) return;

    try { v_f01ee0.current?.pause(); } catch {  }
    v_f01ee0.current = null;
    v_589039(v_3a5fef);
    try {
      const v_21cc31 = v_22b25d();
      const v_f17108 = (window.localStorage.getItem("afterlife.admin.apiOverride")
        || import.meta.env.VITE_API_URL
        || "").replace(/\/$/, "");
      const v_8f00b9 = await fetch(`${v_f17108}/oth-path${v_062ae9}/tts-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(v_21cc31 ? { Authorization: `Bearer ${v_21cc31}` } : {}),
        },
        body: JSON.stringify({ text: v_9b6134 }),
      });
      if (!v_8f00b9.ok) {
        const v_4d33b2 = await v_8f00b9.text().catch(() => "");
        window.alert(`재생 실패 (${v_8f00b9.status}): ${v_4d33b2.slice(0, 200)}`);
        v_589039(null);
        return;
      }
      const v_3263c7 = await v_8f00b9.blob();
      const v_f71b56 = URL.createObjectURL(v_3263c7);
      const v_ff0300 = new Audio(v_f71b56);
      v_f01ee0.current = v_ff0300;
      v_ff0300.onended = () => {
        v_589039(null);
        URL.revokeObjectURL(v_f71b56);
      };
      v_ff0300.onerror = () => {
        v_589039(null);
        URL.revokeObjectURL(v_f71b56);
      };
      await v_ff0300.play();
    } catch (v_9e86fd) {
      window.alert(`재생 오류: ${String(v_9e86fd)}`);
      v_589039(null);
    }
  };

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
                          onClick={() => v_830d22(v_587413.id, v_8d41d7.ts, v_8d41d7.answer)}
                          disabled={v_52ff81 === v_8d41d7.ts}
                          title="이 답변을 클론 목소리로 재생"
                          style={{
                            padding: "2px 8px",
                            background: v_52ff81 === v_8d41d7.ts ? "#7c3aed" : "#3f3f46",
                            border: "1px solid #52525b",
                            borderRadius: 4,
                            color: "#e5e7eb",
                            fontSize: 11,
                            cursor: v_52ff81 === v_8d41d7.ts ? "wait" : "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v_52ff81 === v_8d41d7.ts ? "▶ 재생중…" : "▶ 듣기"}
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
