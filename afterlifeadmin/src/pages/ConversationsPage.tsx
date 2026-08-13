

import { useEffect, useState } from "react";
import { api } from "../api/client";

const DEFAULT_EMAIL = "oth-user@example.invalid";

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

export default function ConversationsPage() {
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [clones, setClones] = useState<CloneWithRecords[]>([]);
  const [selectedCloneId, setSelectedCloneId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setErr(null);
    api.getConversations(email)
      .then((res) => {
        setUserId(res.user_id);
        setClones(res.clones);
        if (res.clones.length > 0 && selectedCloneId === null) {
          setSelectedCloneId(res.clones[0].id);
        }
      })
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();

  }, []);

  const selected = clones.find((c) => c.id === selectedCloneId);

  return (
    <div style={{ padding: 20, color: "#e5e7eb", background: "#0a0a0b", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>통화 대화 조회</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          onClick={load}
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "#2563eb",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "조회 중…" : "조회"}
        </button>
      </div>

      {err && <div style={{ color: "#f87171", marginBottom: 12 }}>오류: {err}</div>}
      {userId != null && <div style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 12 }}>user_id: {userId} · clones: {clones.length}</div>}
      {userId === null && !loading && !err && <div style={{ color: "#a1a1aa" }}>해당 이메일 사용자 없음.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
        {}
        <div style={{ background: "#18181b", borderRadius: 8, padding: 8, maxHeight: "80vh", overflowY: "auto" }}>
          {clones.map((c) => {
            const active = c.id === selectedCloneId;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCloneId(c.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: active ? "#2563eb" : "transparent",
                  marginBottom: 4,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name} <span style={{ color: "#a1a1aa", fontWeight: 400 }}>#{c.id}</span></div>
                <div style={{ fontSize: 11, color: active ? "#dbeafe" : "#a1a1aa", marginTop: 2 }}>
                  turn {c.count ?? c.items.length}
                  {c.error ? ` · err: ${c.error.slice(0, 40)}` : ""}
                </div>
              </div>
            );
          })}
        </div>

        {}
        <div style={{ background: "#18181b", borderRadius: 8, padding: 16, maxHeight: "80vh", overflowY: "auto" }}>
          {selected ? (
            selected.items.length === 0 ? (
              <div style={{ color: "#a1a1aa" }}>대화 기록 없음.</div>
            ) : (
              selected.items.map((t) => {
                const time = new Date(t.ts).toLocaleString("ko-KR");

                const onPlay = () => {
                  const cid = selected.id;
                  const text = t.answer || "";
                  navigator.clipboard?.writeText(text).catch(() => {});
                  window.open("https://rtc.example.invalid/oth-path", "_blank");
                  window.alert(
                    `clone #${cid} 텍스트가 복사됐어. 새로 열린 탭에서 로그인 → 클론 선택(${cid}) → 텍스트 붙여넣고 ▶ 재생.`,
                  );
                };
                return (
                  <div key={t.ts} style={{ padding: "12px 0", borderBottom: "1px solid #27272a" }}>
                    <div style={{ fontSize: 11, color: "#71717a", marginBottom: 6 }}>{time}</div>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ color: "#60a5fa", fontSize: 12, marginRight: 6 }}>사용자</span>
                      <span style={{ fontSize: 14 }}>{t.input || <i style={{ color: "#71717a" }}>(비어있음)</i>}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ color: "#a78bfa", fontSize: 12, marginRight: 6, whiteSpace: "nowrap" }}>클론</span>
                      <span style={{ fontSize: 14, flex: 1 }}>{t.answer || <i style={{ color: "#71717a" }}>(비어있음)</i>}</span>
                      {t.answer && (
                        <button
                          onClick={onPlay}
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
