

import { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";
import { v_383169 } from "../lib/auth";

const v_7f7b1d = "https://rtc.example.invalid/oth-path";

const v_e86257 = import.meta.env.VITE_VERIFY_URL ?? v_7f7b1d;
const v_9d0f6a = new URL(v_e86257).origin;

const v_3385e5 = 8000;
const v_a2b9d6 = 1000;

type L0 = { rules_text: string; blocklist: string[] };
type ApplyReq = { id: string; draft: L0; current: L0 | null; loadError: string | null };

function v_0ef82a(v_479f05): L0 | null {
  if (!v_479f05 || typeof v_479f05 !== "object") return null;
  const v_cb35cb = v_479f05 as { rules_text?: unknown; blocklist?: unknown };
  if (typeof v_cb35cb.rules_text !== "string" || !Array.isArray(v_cb35cb.blocklist)) return null;
  if (!v_cb35cb.blocklist.every((v_62c214) => typeof v_62c214 === "string")) return null;
  return { rules_text: v_cb35cb.rules_text, blocklist: v_cb35cb.blocklist as string[] };
}

export function v_d3670a() {
  const v_1e24ba = v_e662ae<HTMLIFrameElement>(null);
  const [v_309144, v_c67066] = v_5ab095<ApplyReq | null>(null);
  const [v_35bf26, v_04e389] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);
  const v_c0d0b6 = v_383169()?.role === "super_admin";

  const v_677216 = (v_389afb, v_43c42e) => {
    v_1e24ba.current?.contentWindow?.postMessage(
      { type: "afl:l0-apply-result", id: v_389afb, ...v_43c42e },
      v_9d0f6a,
    );
  };

  v_c4deb2(() => {
    const v_f0bd5d = (v_1d299c) => {
      if (v_1d299c.origin !== v_9d0f6a || v_1d299c.source !== v_1e24ba.current?.contentWindow) return;
      const v_d5dda0 = v_1d299c.data as { type?: unknown; id?: unknown; draft?: unknown } | null;
      if (!v_d5dda0 || v_d5dda0.type !== "afl:l0-apply" || typeof v_d5dda0.id !== "string") return;
      const v_389afb = v_d5dda0.id;
      const v_f04727 = v_0ef82a(v_d5dda0.draft);
      if (!v_f04727) {
        v_677216(v_389afb, { ok: false, error: "잘못된 L0 초안 형식" });
        return;
      }
      v_3a7d09(null);
      v_c67066({ id: v_389afb, draft: v_f04727, current: null, loadError: null });
      v_05a921
        .getSystemPersona()
        .then((v_c3bc75) =>
          v_c67066((v_cb35cb) => (v_cb35cb && v_cb35cb.id === v_389afb ? { ...v_cb35cb, current: { rules_text: v_c3bc75.rules_text ?? "", blocklist: v_c3bc75.blocklist ?? [] } } : v_cb35cb)),
        )
        .catch((v_9e86fd) =>
          v_c67066((v_cb35cb) => (v_cb35cb && v_cb35cb.id === v_389afb ? { ...v_cb35cb, loadError: v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd) } : v_cb35cb)),
        );
    };
    window.addEventListener("message", v_f0bd5d);
    return () => window.removeEventListener("message", v_f0bd5d);
  }, []);

  const v_5df3e0 = () => {
    if (v_309144) v_677216(v_309144.id, { ok: false, cancelled: true });
    v_c67066(null);
  };

  const v_ce9295 = async () => {
    if (!v_309144) return;
    v_04e389(true);
    v_3a7d09(null);
    try {
      await v_05a921.updateSystemPersona(v_309144.draft);
      v_677216(v_309144.id, { ok: true, saved: v_309144.draft });
      v_c67066(null);
    } catch (v_9e86fd) {
      v_3a7d09(v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd));
    } finally {
      v_04e389(false);
    }
  };

  const v_d0bb64 =
    !!v_309144 && (v_309144.draft.rules_text.length > v_3385e5 || v_309144.draft.blocklist.length > v_a2b9d6);
  const v_214fef =
    !!v_309144?.current &&
    v_309144.current.rules_text === v_309144.draft.rules_text &&
    v_309144.current.blocklist.join("\n") === v_309144.draft.blocklist.join("\n");

  return (
    <div style={v_d81136.root}>
      <div style={v_d81136.header}>
        <div>
          <h1 style={v_d81136.title}>대화 트레이닝 랩</h1>
          <p style={v_d81136.desc}>
            클론 대화 LLM 검증 — L2 기억 · L2′ 화자 오버레이 · L1 지식.
            가비아 prethird 화면을 그대로 띄웁니다.
          </p>
        </div>
        <a href={v_e86257} target="_blank" rel="noreferrer" style={v_d81136.newTab}>
          새 탭으로 열기 ↗
        </a>
      </div>

      {
}
      <iframe
        ref={v_1e24ba}
        src={v_e86257}
        title="클론 대화 LLM 검증"
        style={v_d81136.frame}

        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"
      />

      <p style={v_d81136.note}>
        접속 주소: <code style={v_d81136.code}>{v_e86257}</code>
        {" · "}
        화면 안에서 <b>verify 비밀번호</b>를 별도로 입력해야 데이터가 조회됩니다.
      </p>

      {v_309144 && (
        <div style={v_d81136.backdrop}>
          <div style={v_d81136.modal} role="dialog" aria-modal="true">
            <h2 style={v_d81136.modalTitle}>L0 전역 안전 — 운영 적용</h2>
            <p style={v_d81136.warn}>
              모든 클론의 통화에 공통으로 들어가는 규칙입니다. 저장하면 이후 새로 시작하는 통화부터 바로 반영됩니다.
            </p>
            {!v_c0d0b6 && <p style={v_d81136.err}>super_admin 만 운영 L0 를 저장할 수 있습니다.</p>}
            {v_309144.loadError && <p style={v_d81136.err}>현재 운영값을 불러오지 못했습니다: {v_309144.loadError}</p>}
            {v_d0bb64 && (
              <p style={v_d81136.err}>
                상한 초과 — 안전규칙 {v_3385e5}자 · 금지어 {v_a2b9d6}개까지 저장됩니다.
              </p>
            )}
            {v_214fef && <p style={v_d81136.desc}>현재 운영값과 같습니다.</p>}

            <div style={v_d81136.cols}>
              <div style={v_d81136.col}>
                <div style={v_d81136.colHead}>현재 운영값</div>
                <pre style={v_d81136.pre}>{v_309144.current ? v_309144.current.rules_text || "(비어 있음)" : "불러오는 중…"}</pre>
                <div style={v_d81136.colSub}>금지어 {v_309144.current?.blocklist.length ?? "-"}개</div>
                <pre style={v_d81136.preShort}>{v_309144.current?.blocklist.join(", ") || "-"}</pre>
              </div>
              <div style={v_d81136.col}>
                <div style={v_d81136.colHead}>적용할 값 (랩 초안)</div>
                <pre style={v_d81136.pre}>{v_309144.draft.rules_text || "(비어 있음)"}</pre>
                <div style={v_d81136.colSub}>금지어 {v_309144.draft.blocklist.length}개</div>
                <pre style={v_d81136.preShort}>{v_309144.draft.blocklist.join(", ") || "-"}</pre>
              </div>
            </div>

            {v_5e9bfe && <p style={v_d81136.err}>저장 실패: {v_5e9bfe}</p>}
            <div style={v_d81136.actions}>
              <button style={v_d81136.btn} onClick={v_5df3e0} disabled={v_35bf26}>
                취소
              </button>
              <button
                style={{ ...v_d81136.btn, ...v_d81136.btnPrimary }}
                onClick={v_ce9295}
                disabled={v_35bf26 || !v_c0d0b6 || !v_309144.current || v_d0bb64 || v_214fef}
              >
                {v_35bf26 ? "저장 중…" : "운영에 적용"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const v_d81136 = {

  root: {
    margin: "-24px -32px",
    padding: "16px 20px 12px",
    display: "flex",
    flexDirection: "column",

    minHeight: "calc(100vh - 28px)",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: 700, margin: 0, color: "#0f172a" },
  desc: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  newTab: {
    flexShrink: 0,
    fontSize: 13,
    color: "#2563eb",
    textDecoration: "none",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    padding: "6px 12px",
    backgroundColor: "#fff",
    whiteSpace: "nowrap",
  },
  frame: {
    flex: 1,
    width: "100%",
    minHeight: 600,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  note: { fontSize: 12, color: "#94a3b8", margin: "8px 0 0" },
  code: { fontFamily: "ui-monospace, monospace", fontSize: 11 },
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: "18px 20px",
    width: "min(960px, 100%)",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  modalTitle: { fontSize: 17, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" },
  warn: { fontSize: 13, color: "#b45309", margin: "0 0 8px" },
  err: { fontSize: 13, color: "#dc2626", margin: "4px 0" },
  cols: { display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" },
  col: { flex: "1 1 300px", minWidth: 0 },
  colHead: { fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 },
  colSub: { fontSize: 12, color: "#64748b", margin: "6px 0 2px" },
  pre: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 12,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    padding: 8,
    margin: 0,
    maxHeight: 320,
    overflow: "auto",
  },
  preShort: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 12,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    padding: 8,
    margin: 0,
    maxHeight: 100,
    overflow: "auto",
  },
  actions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 },
  btn: {
    fontSize: 13,
    padding: "7px 14px",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
  btnPrimary: { backgroundColor: "#2563eb", borderColor: "#2563eb", color: "#fff" },
};
