import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  API_CATALOG,
  API_CATEGORIES,
  type ApiEndpoint,
  type UiLink,
} from "../data/apiCatalog";
import {
  rawRequest,
  setAdminToken,
  getAdminToken,
  type RawResponse,
} from "../api/client";

const AUTH_COLORS: Record<string, string> = {
  public: "#10b981",
  required: "#3b82f6",
  optional: "#8b5cf6",
  admin: "#ef4444",
  "dev-only": "#f59e0b",
};

const METHOD_COLORS: Record<string, string> = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#f59e0b",
  DELETE: "#ef4444",
};

function defaultBody(ep: ApiEndpoint): string {
  if (!ep.hasBody) return "";
  return "{\n  \n}";
}

function resolvePath(
  template: string,
  params: Record<string, string>,
  query: Record<string, string>,
): string {
  let out = template;
  for (const k of Object.keys(params)) {
    out = out.replace(`:${k}`, encodeURIComponent(params[k] ?? ""));
  }
  const entries = Object.entries(query).filter(([, v]) => v !== "");
  if (entries.length > 0) {
    const qs = new URLSearchParams();
    for (const [k, v] of entries) qs.set(k, v);
    out += `?${qs.toString()}`;
  }
  return out;
}

export function ApiTestbedPage() {
  const [filter, setFilter] = useState("");
  const [authFilter, setAuthFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string>(API_CATALOG[0]?.id ?? "");
  const selected = API_CATALOG.find((e) => e.id === selectedId);

  const [pathVals, setPathVals] = useState<Record<string, string>>({});
  const [queryVals, setQueryVals] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [resp, setResp] = useState<RawResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string>(getAdminToken() ?? "");

  const grouped = useMemo(() => {
    const q = filter.toLowerCase();
    const filtered = API_CATALOG.filter(
      (e) =>
        (!q ||
          e.path.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.file.toLowerCase().includes(q)) &&
        (!authFilter || e.auth === authFilter),
    );
    const g: Record<string, ApiEndpoint[]> = {};
    for (const c of API_CATEGORIES) g[c] = [];
    for (const e of filtered) g[e.category].push(e);
    return g;
  }, [filter, authFilter]);

  function selectEndpoint(e: ApiEndpoint) {
    setSelectedId(e.id);
    const pv: Record<string, string> = {};
    for (const p of e.pathParams) pv[p] = "";
    setPathVals(pv);
    const qv: Record<string, string> = {};
    for (const q of e.queryKeys) qv[q] = "";
    setQueryVals(qv);
    setBody(defaultBody(e));
    setResp(null);
    setErr(null);
  }

  async function execute() {
    if (!selected) return;
    setBusy(true);
    setErr(null);
    setResp(null);
    try {
      const url = resolvePath(selected.path, pathVals, queryVals);
      let parsedBody: unknown = undefined;
      if (body.trim().length > 0) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          throw new Error("Request body is not valid JSON");
        }
      }
      const r = await rawRequest(selected.method, url, parsedBody);
      setResp(r);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function saveToken() {
    setAdminToken(token.trim() || null);
    alert(token ? "Token saved" : "Token cleared");
  }

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>API Testbed</h1>
      <div style={styles.sub}>
        전체 {API_CATALOG.length}개 엔드포인트 · dev 서버(/oth-path) 실행 · Bearer 토큰은
        localStorage에 저장됩니다.
      </div>

      <div style={styles.tokenRow}>
        <input
          style={styles.tokenInput}
          placeholder="Authorization Bearer token (optional)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <button style={styles.btnSecondary} onClick={saveToken}>
          저장
        </button>
      </div>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <input
            style={styles.search}
            placeholder="검색 (path/category/file)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select
            style={styles.search}
            value={authFilter}
            onChange={(e) => setAuthFilter(e.target.value)}
          >
            <option value="">전체 auth</option>
            <option value="public">public</option>
            <option value="required">required</option>
            <option value="optional">optional</option>
            <option value="admin">admin</option>
            <option value="dev-only">dev-only</option>
          </select>
          <div style={styles.listWrap}>
            {API_CATEGORIES.map((cat) => {
              const items = grouped[cat];
              if (!items || items.length === 0) return null;
              return (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div style={styles.catHead}>
                    {cat} ({items.length})
                  </div>
                  {items.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => selectEndpoint(e)}
                      style={{
                        ...styles.endpointBtn,
                        backgroundColor:
                          e.id === selectedId ? "#e0edff" : "transparent",
                        borderLeft:
                          e.id === selectedId
                            ? "3px solid #3b82f6"
                            : "3px solid transparent",
                      }}
                    >
                      <span
                        style={{
                          ...styles.methodBadge,
                          backgroundColor: METHOD_COLORS[e.method] ?? "#64748b",
                        }}
                      >
                        {e.method}
                      </span>
                      <span style={styles.endpointPath}>{e.path}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </aside>

        <section style={styles.main}>
          {!selected ? (
            <div style={{ color: "#94a3b8" }}>엔드포인트를 선택하세요.</div>
          ) : (
            <EndpointDetail
              ep={selected}
              pathVals={pathVals}
              setPathVals={setPathVals}
              queryVals={queryVals}
              setQueryVals={setQueryVals}
              body={body}
              setBody={setBody}
              onExecute={execute}
              busy={busy}
              resp={resp}
              err={err}
            />
          )}
        </section>
      </div>
    </div>
  );
}

interface DetailProps {
  ep: ApiEndpoint;
  pathVals: Record<string, string>;
  setPathVals: (v: Record<string, string>) => void;
  queryVals: Record<string, string>;
  setQueryVals: (v: Record<string, string>) => void;
  body: string;
  setBody: (v: string) => void;
  onExecute: () => void;
  busy: boolean;
  resp: RawResponse | null;
  err: string | null;
}

function EndpointDetail({
  ep,
  pathVals,
  setPathVals,
  queryVals,
  setQueryVals,
  body,
  setBody,
  onExecute,
  busy,
  resp,
  err,
}: DetailProps) {
  return (
    <div>
      <div style={styles.detailHeader}>
        <span
          style={{
            ...styles.methodBadgeLg,
            backgroundColor: METHOD_COLORS[ep.method] ?? "#64748b",
          }}
        >
          {ep.method}
        </span>
        <code style={styles.fullPath}>{ep.path}</code>
        <span
          style={{
            ...styles.authBadge,
            backgroundColor: AUTH_COLORS[ep.auth] ?? "#64748b",
          }}
        >
          {ep.auth}
        </span>
      </div>
      <div style={styles.metaRow}>
        <span style={styles.meta}>
          {ep.file}:{ep.line}
        </span>
        <span style={styles.meta}>{ep.category}</span>
      </div>

      <UiLinksBlock links={ep.uiLinks} />

      {ep.pathParams.length > 0 && (
        <Fieldset legend="Path Parameters">
          {ep.pathParams.map((p) => (
            <FieldRow key={p} label={`:${p}`}>
              <input
                style={styles.input}
                value={pathVals[p] ?? ""}
                onChange={(e) =>
                  setPathVals({ ...pathVals, [p]: e.target.value })
                }
              />
            </FieldRow>
          ))}
        </Fieldset>
      )}

      {ep.queryKeys.length > 0 && (
        <Fieldset legend="Query Parameters">
          {ep.queryKeys.map((q) => (
            <FieldRow key={q} label={`?${q}`}>
              <input
                style={styles.input}
                value={queryVals[q] ?? ""}
                onChange={(e) =>
                  setQueryVals({ ...queryVals, [q]: e.target.value })
                }
              />
            </FieldRow>
          ))}
        </Fieldset>
      )}

      {ep.hasBody && (
        <Fieldset legend="Request Body (JSON)">
          {ep.bodyHint && (
            <div style={styles.hint}>zod hint: {ep.bodyHint}</div>
          )}
          <textarea
            style={styles.textarea}
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
          />
        </Fieldset>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          style={{ ...styles.btnPrimary, opacity: busy ? 0.6 : 1 }}
          onClick={onExecute}
          disabled={busy}
        >
          {busy ? "실행 중..." : "Execute"}
        </button>
      </div>

      {err && <div style={styles.err}>{err}</div>}
      {resp && <ResponseView resp={resp} />}
    </div>
  );
}

function UiLinksBlock({ links }: { links: UiLink[] }) {
  if (!links || links.length === 0) {
    return (
      <div style={styles.uiLinksEmpty}>
        UI consumer 정보 없음 (health / dev-only / 내부용 가능성)
      </div>
    );
  }
  return (
    <div style={styles.uiLinks}>
      <div style={styles.uiLinksTitle}>UI Consumers</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {links.map((l, idx) => (
          <UiLinkChip key={idx} link={l} />
        ))}
      </div>
    </div>
  );
}

function UiLinkChip({ link }: { link: UiLink }) {
  const bg = link.app === "web" ? "#3b82f6" : "#8b5cf6";
  const canNavigate = link.app === "web" && !link.route.includes(":");
  const content = (
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
        {link.app.toUpperCase()}
      </span>
      <span>{link.label}</span>
      <span style={{ opacity: 0.75, marginLeft: 6 }}>· {link.route}</span>
    </>
  );
  if (canNavigate) {
    return (
      <Link
        to={link.route}
        style={{
          ...styles.chip,
          backgroundColor: bg,
          textDecoration: "none",
        }}
      >
        {content}
      </Link>
    );
  }
  return (
    <span style={{ ...styles.chip, backgroundColor: bg }} title={link.route}>
      {content}
    </span>
  );
}

function ResponseView({ resp }: { resp: RawResponse }) {
  const statusColor =
    resp.status >= 200 && resp.status < 300
      ? "#10b981"
      : resp.status >= 400
        ? "#ef4444"
        : "#f59e0b";
  return (
    <div style={styles.respBox}>
      <div style={styles.respHeader}>
        <span
          style={{
            ...styles.statusBadge,
            backgroundColor: statusColor,
          }}
        >
          {resp.status}
        </span>
        <span style={styles.meta}>{resp.timeMs} ms</span>
      </div>
      <details style={{ marginTop: 8 }}>
        <summary style={styles.summary}>Headers</summary>
        <pre style={styles.pre}>
          {JSON.stringify(resp.headers, null, 2)}
        </pre>
      </details>
      <div style={{ marginTop: 8 }}>
        <div style={styles.summary}>Body</div>
        <pre style={styles.pre}>
          {typeof resp.body === "string"
            ? resp.body
            : JSON.stringify(resp.body, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset style={styles.fieldset}>
      <legend style={styles.legend}>{legend}</legend>
      {children}
    </fieldset>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.fieldRow}>
      <label style={styles.label}>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
