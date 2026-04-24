import { v_df9f57, v_5ab095 } from "bapkr";
import { v_80cb8d } from "pgmzxjkoagjpdcvd";
import {
  v_b4a7e7,
  v_f157f0,
  type v_ebbded,
  type v_36566f,
} from "../data/apiCatalog";
import {
  v_8e836f,
  v_c94c9c,
  v_22b25d,
  type v_526d71,
} from "../api/client";

const v_b54ec6 = {
  public: "#10b981",
  required: "#3b82f6",
  optional: "#8b5cf6",
  admin: "#ef4444",
  "dev-only": "#f59e0b",
};

const v_7f5027 = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#f59e0b",
  DELETE: "#ef4444",
};

function v_2993a6(ep: v_ebbded): string {
  if (!v_3c8898.hasBody) return "";
  return "{\n  \n}";
}

function v_7cfe5a(
  v_ea7a24,
  v_24baff,
  v_7c5791,
): string {
  let v_8d4337 = v_ea7a24;
  for (const v_0eb677 of Object.keys(v_24baff)) {
    v_8d4337 = v_8d4337.replace(`:${v_0eb677}`, encodeURIComponent(v_24baff[v_0eb677] ?? ""));
  }
  const v_1e6eca = Object.entries(v_7c5791).filter(([, v_81e2ef]) => v_81e2ef !== "");
  if (v_1e6eca.length > 0) {
    const v_212049 = new URLSearchParams();
    for (const [v_0eb677, v_81e2ef] of v_1e6eca) v_212049.set(v_0eb677, v_81e2ef);
    v_8d4337 += `?${v_212049.toString()}`;
  }
  return v_8d4337;
}

export function v_f2e9f5() {
  const [v_f21110, v_d217e7] = v_5ab095("");
  const [v_e061f8, v_808dd4] = v_5ab095<string>("");
  const [v_2b330f, v_3e8aa4] = v_5ab095<string>(v_b4a7e7[0]?.id ?? "");
  const v_587413 = v_b4a7e7.find((v_9e86fd) => v_9e86fd.id === v_2b330f);

  const [v_be9c8b, v_a92343] = v_5ab095<Record<string, string>>({});
  const [v_32d8ed, v_704eb8] = v_5ab095<Record<string, string>>({});
  const [v_4d33b2, v_c1c921] = v_5ab095("");
  const [v_eb792a, v_a63a11] = v_5ab095<v_526d71 | null>(null);
  const [v_49263d, v_8a5996] = v_5ab095<string | null>(null);
  const [v_3f8465, v_b4f1d2] = v_5ab095(false);
  const [v_21cc31, v_49c54d] = v_5ab095<string>(v_22b25d() ?? "");

  const v_4d79ca = v_df9f57(() => {
    const v_ab6401 = v_f21110.toLowerCase();
    const v_e4cf17 = v_b4a7e7.filter(
      (v_9e86fd) =>
        (!v_ab6401 ||
          v_9e86fd.path.toLowerCase().includes(v_ab6401) ||
          v_9e86fd.category.toLowerCase().includes(v_ab6401) ||
          v_9e86fd.file.toLowerCase().includes(v_ab6401)) &&
        (!v_e061f8 || v_9e86fd.auth === v_e061f8),
    );
    const g: Record<string, v_ebbded[]> = {};
    for (const v_3f4e2e of v_f157f0) v_206b88[v_3f4e2e] = [];
    for (const v_9e86fd of v_e4cf17) v_206b88[v_9e86fd.category].push(v_9e86fd);
    return v_206b88;
  }, [v_f21110, v_e061f8]);

  function v_0caff1(e: v_ebbded) {
    v_3e8aa4(v_9e86fd.id);
    const v_7b6854 = {};
    for (const v_e2a85c of v_9e86fd.pathParams) v_7b6854[v_e2a85c] = "";
    v_a92343(v_7b6854);
    const v_78f0b5 = {};
    for (const v_ab6401 of v_9e86fd.queryKeys) v_78f0b5[v_ab6401] = "";
    v_704eb8(v_78f0b5);
    v_c1c921(v_2993a6(v_9e86fd));
    v_a63a11(null);
    v_8a5996(null);
  }

  async function v_00b5d2() {
    if (!v_587413) return;
    v_b4f1d2(true);
    v_8a5996(null);
    v_a63a11(null);
    try {
      const v_f71b56 = v_7cfe5a(v_587413.path, v_be9c8b, v_32d8ed);
      let v_6dcc8c = undefined;
      if (v_4d33b2.trim().length > 0) {
        try {
          v_6dcc8c = JSON.parse(v_4d33b2);
        } catch {
          throw new Error("Request body is not valid JSON");
        }
      }
      const v_cb35cb = await v_8e836f(v_587413.method, v_f71b56, v_6dcc8c);
      v_a63a11(v_cb35cb);
    } catch (v_9e86fd) {
      v_8a5996((v_9e86fd as Error).message);
    } finally {
      v_b4f1d2(false);
    }
  }

  function v_44c8c1() {
    v_c94c9c(v_21cc31.trim() || null);
    alert(v_21cc31 ? "Token saved" : "Token cleared");
  }

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>API Testbed</h1>
      <div style={v_d81136.sub}>
        전체 {v_b4a7e7.length}개 엔드포인트 · dev 서버(/oth-path) 실행 · Bearer 토큰은
        localStorage에 저장됩니다.
      </div>

      <div style={v_d81136.tokenRow}>
        <input
          style={v_d81136.tokenInput}
          placeholder="Authorization Bearer token (optional)"
          value={v_21cc31}
          onChange={(v_9e86fd) => v_49c54d(v_9e86fd.target.value)}
        />
        <button style={v_d81136.btnSecondary} onClick={v_44c8c1}>
          저장
        </button>
      </div>

      <div style={v_d81136.layout}>
        <aside style={v_d81136.sidebar}>
          <input
            style={v_d81136.search}
            placeholder="검색 (path/category/file)"
            value={v_f21110}
            onChange={(v_9e86fd) => v_d217e7(v_9e86fd.target.value)}
          />
          <select
            style={v_d81136.search}
            value={v_e061f8}
            onChange={(v_9e86fd) => v_808dd4(v_9e86fd.target.value)}
          >
            <option value="">전체 auth</option>
            <option value="public">public</option>
            <option value="required">required</option>
            <option value="optional">optional</option>
            <option value="admin">admin</option>
            <option value="dev-only">dev-only</option>
          </select>
          <div style={v_d81136.listWrap}>
            {v_f157f0.map((v_9bf432) => {
              const v_4622b9 = v_4d79ca[v_9bf432];
              if (!v_4622b9 || v_4622b9.length === 0) return null;
              return (
                <div key={v_9bf432} style={{ marginBottom: 12 }}>
                  <div style={v_d81136.catHead}>
                    {v_9bf432} ({v_4622b9.length})
                  </div>
                  {v_4622b9.map((v_9e86fd) => (
                    <button
                      key={v_9e86fd.id}
                      onClick={() => v_0caff1(v_9e86fd)}
                      style={{
                        ...v_d81136.endpointBtn,
                        backgroundColor:
                          v_9e86fd.id === v_2b330f ? "#e0edff" : "transparent",
                        borderLeft:
                          v_9e86fd.id === v_2b330f
                            ? "3px solid #3b82f6"
                            : "3px solid transparent",
                      }}
                    >
                      <span
                        style={{
                          ...v_d81136.methodBadge,
                          backgroundColor: v_7f5027[v_9e86fd.method] ?? "#64748b",
                        }}
                      >
                        {v_9e86fd.method}
                      </span>
                      <span style={v_d81136.endpointPath}>{v_9e86fd.path}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </aside>

        <section style={v_d81136.main}>
          {!v_587413 ? (
            <div style={{ color: "#94a3b8" }}>엔드포인트를 선택하세요.</div>
          ) : (
            <EndpointDetail
              ep={v_587413}
              pathVals={v_be9c8b}
              setPathVals={v_a92343}
              queryVals={v_32d8ed}
              setQueryVals={v_704eb8}
              body={v_4d33b2}
              setBody={v_c1c921}
              onExecute={v_00b5d2}
              busy={v_3f8465}
              resp={v_eb792a}
              err={v_49263d}
            />
          )}
        </section>
      </div>
    </div>
  );
}

interface DetailProps {
  ep: v_ebbded;
  pathVals: Record<string, string>;
  setPathVals: (v: Record<string, string>) => void;
  queryVals: Record<string, string>;
  setQueryVals: (v: Record<string, string>) => void;
  body: string;
  setBody: (v: string) => void;
  onExecute: () => void;
  busy: boolean;
  resp: v_526d71 | null;
  err: string | null;
}

function v_7e82de({
  ep: v_3c8898,
  pathVals: v_be9c8b,
  setPathVals: v_a92343,
  queryVals: v_32d8ed,
  setQueryVals: v_704eb8,
  body: v_4d33b2,
  setBody: v_c1c921,
  onExecute: v_3b426c,
  busy: v_3f8465,
  resp: v_eb792a,
  err: v_49263d,
}: DetailProps) {
  return (
    <div>
      <div style={v_d81136.detailHeader}>
        <span
          style={{
            ...v_d81136.methodBadgeLg,
            backgroundColor: v_7f5027[v_3c8898.method] ?? "#64748b",
          }}
        >
          {v_3c8898.method}
        </span>
        <code style={v_d81136.fullPath}>{v_3c8898.path}</code>
        <span
          style={{
            ...v_d81136.authBadge,
            backgroundColor: v_b54ec6[v_3c8898.auth] ?? "#64748b",
          }}
        >
          {v_3c8898.auth}
        </span>
      </div>
      <div style={v_d81136.metaRow}>
        <span style={v_d81136.meta}>
          {v_3c8898.file}:{v_3c8898.line}
        </span>
        <span style={v_d81136.meta}>{v_3c8898.category}</span>
      </div>

      <UiLinksBlock links={v_3c8898.uiLinks} />

      {v_3c8898.pathParams.length > 0 && (
        <Fieldset legend="Path Parameters">
          {v_3c8898.pathParams.map((v_e2a85c) => (
            <FieldRow key={v_e2a85c} label={`:${v_e2a85c}`}>
              <input
                style={v_d81136.input}
                value={v_be9c8b[v_e2a85c] ?? ""}
                onChange={(v_9e86fd) =>
                  v_a92343({ ...v_be9c8b, [v_e2a85c]: v_9e86fd.target.value })
                }
              />
            </FieldRow>
          ))}
        </Fieldset>
      )}

      {v_3c8898.queryKeys.length > 0 && (
        <Fieldset legend="Query Parameters">
          {v_3c8898.queryKeys.map((v_ab6401) => (
            <FieldRow key={v_ab6401} label={`?${v_ab6401}`}>
              <input
                style={v_d81136.input}
                value={v_32d8ed[v_ab6401] ?? ""}
                onChange={(v_9e86fd) =>
                  v_704eb8({ ...v_32d8ed, [v_ab6401]: v_9e86fd.target.value })
                }
              />
            </FieldRow>
          ))}
        </Fieldset>
      )}

      {v_3c8898.hasBody && (
        <Fieldset legend="Request Body (JSON)">
          {v_3c8898.bodyHint && (
            <div style={v_d81136.hint}>zod hint: {v_3c8898.bodyHint}</div>
          )}
          <textarea
            style={v_d81136.textarea}
            rows={10}
            value={v_4d33b2}
            onChange={(v_9e86fd) => v_c1c921(v_9e86fd.target.value)}
            spellCheck={false}
          />
        </Fieldset>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          style={{ ...v_d81136.btnPrimary, opacity: v_3f8465 ? 0.6 : 1 }}
          onClick={v_3b426c}
          disabled={v_3f8465}
        >
          {v_3f8465 ? "실행 중..." : "Execute"}
        </button>
      </div>

      {v_49263d && <div style={v_d81136.err}>{v_49263d}</div>}
      {v_eb792a && <ResponseView resp={v_eb792a} />}
    </div>
  );
}

function v_2930d1({ links: v_3927a4 }: { links: v_36566f[] }) {
  if (!v_3927a4 || v_3927a4.length === 0) {
    return (
      <div style={v_d81136.uiLinksEmpty}>
        UI consumer 정보 없음 (health / dev-only / 내부용 가능성)
      </div>
    );
  }
  return (
    <div style={v_d81136.uiLinks}>
      <div style={v_d81136.uiLinksTitle}>UI Consumers</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {v_3927a4.map((v_1614db, v_e86ad8) => (
          <UiLinkChip key={v_e86ad8} link={v_1614db} />
        ))}
      </div>
    </div>
  );
}

function v_15cde2({ link: v_8dbe00 }: { link: v_36566f }) {
  const v_6fe397 = v_8dbe00.app === "web" ? "#3b82f6" : "#8b5cf6";
  const v_aea381 = v_8dbe00.app === "web" && !v_8dbe00.route.includes(":");
  const v_b43b74 = (
    <>
      <span
        style={{
          fontSize: 10,
          backgroundColor: "rgba(255,255,255,0.25)",
          padding: "1px 6px",
          borderRadius: 4,
          marginRight: 6,
          fontWeight: 700,
        }}
      >
        {v_8dbe00.app.toUpperCase()}
      </span>
      <span>{v_8dbe00.label}</span>
      <span style={{ opacity: 0.75, marginLeft: 6 }}>· {v_8dbe00.route}</span>
    </>
  );
  if (v_aea381) {
    return (
      <Link
        to={v_8dbe00.route}
        style={{
          ...v_d81136.chip,
          backgroundColor: v_6fe397,
          textDecoration: "none",
        }}
      >
        {v_b43b74}
      </Link>
    );
  }
  return (
    <span style={{ ...v_d81136.chip, backgroundColor: v_6fe397 }} title={v_8dbe00.route}>
      {v_b43b74}
    </span>
  );
}

function v_c0bd46({ resp: v_eb792a }: { resp: v_526d71 }) {
  const v_dd5e8b =
    v_eb792a.status >= 200 && v_eb792a.status < 300
      ? "#10b981"
      : v_eb792a.status >= 400
        ? "#ef4444"
        : "#f59e0b";
  return (
    <div style={v_d81136.respBox}>
      <div style={v_d81136.respHeader}>
        <span
          style={{
            ...v_d81136.statusBadge,
            backgroundColor: v_dd5e8b,
          }}
        >
          {v_eb792a.status}
        </span>
        <span style={v_d81136.meta}>{v_eb792a.timeMs} ms</span>
      </div>
      <details style={{ marginTop: 8 }}>
        <summary style={v_d81136.summary}>Headers</summary>
        <pre style={v_d81136.pre}>
          {JSON.stringify(v_eb792a.headers, null, 2)}
        </pre>
      </details>
      <div style={{ marginTop: 8 }}>
        <div style={v_d81136.summary}>Body</div>
        <pre style={v_d81136.pre}>
          {typeof v_eb792a.body === "string"
            ? v_eb792a.body
            : JSON.stringify(v_eb792a.body, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function v_c64510({
  legend: v_e2745e,
  children: v_21f619,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset style={v_d81136.fieldset}>
      <legend style={v_d81136.legend}>{v_e2745e}</legend>
      {v_21f619}
    </fieldset>
  );
}

function v_084f11({
  label: v_2869c1,
  children: v_21f619,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={v_d81136.fieldRow}>
      <label style={v_d81136.label}>{v_2869c1}</label>
      <div style={{ flex: 1 }}>{v_21f619}</div>
    </div>
  );
}

const v_d81136 = {
  sub: { color: "#64748b", fontSize: 13, marginBottom: 16 },
  tokenRow: { display: "flex", gap: 8, marginBottom: 12 },
  tokenInput: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 12,
  },
  layout: { display: "flex", gap: 16 },
  sidebar: {
    width: 360,
    flexShrink: 0,
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 12,
    maxHeight: "calc(100vh - 220px)",
    display: "flex",
    flexDirection: "column",
  },
  search: {
    width: "100%",
    padding: "8px 10px",
    marginBottom: 8,
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 13,
    boxSizing: "border-box",
  },
  listWrap: { overflowY: "auto", flex: 1 },
  catHead: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    padding: "6px 4px",
    letterSpacing: 0.5,
  },
  endpointBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 8px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
  },
  methodBadge: {
    display: "inline-block",
    minWidth: 52,
    textAlign: "center",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
    fontFamily: "monospace",
  },
  endpointPath: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  main: {
    flex: 1,
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 20,
    minHeight: 400,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  methodBadgeLg: {
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "monospace",
  },
  fullPath: {
    fontFamily: "monospace",
    fontSize: 15,
    color: "#1e293b",
    fontWeight: 600,
  },
  authBadge: {
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  metaRow: {
    display: "flex",
    gap: 16,
    marginBottom: 16,
  },
  meta: { color: "#64748b", fontSize: 12 },
  uiLinks: {
    marginBottom: 16,
    padding: "10px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
  },
  uiLinksEmpty: {
    marginBottom: 16,
    padding: "8px 12px",
    color: "#94a3b8",
    fontSize: 12,
    fontStyle: "italic",
  },
  uiLinksTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  chip: {
    color: "#fff",
    fontSize: 12,
    padding: "5px 10px",
    borderRadius: 16,
    display: "inline-flex",
    alignItems: "center",
  },
  fieldset: {
    margin: "12px 0",
    padding: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 6,
  },
  legend: { padding: "0 6px", fontSize: 12, color: "#64748b", fontWeight: 600 },
  fieldRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    width: 120,
    fontFamily: "monospace",
    fontSize: 12,
    color: "#1e293b",
  },
  input: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    fontFamily: "monospace",
    fontSize: 12,
    boxSizing: "border-box",
  },
  hint: {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 6,
    fontFamily: "monospace",
  },
  textarea: {
    width: "100%",
    padding: 10,
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    fontFamily: "monospace",
    fontSize: 12,
    boxSizing: "border-box",
    resize: "vertical",
  },
  btnPrimary: {
    padding: "10px 22px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "8px 16px",
    backgroundColor: "#64748b",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
  },
  err: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 6,
    fontSize: 13,
  },
  respBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
  },
  respHeader: { display: "flex", gap: 12, alignItems: "center" },
  statusBadge: {
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 4,
    fontWeight: 700,
    fontFamily: "monospace",
    fontSize: 13,
  },
  summary: {
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
  },
  pre: {
    marginTop: 6,
    padding: 10,
    backgroundColor: "#1e293b",
    color: "#f1f5f9",
    borderRadius: 4,
    fontSize: 12,
    overflow: "auto",
    maxHeight: 400,
  },
};
