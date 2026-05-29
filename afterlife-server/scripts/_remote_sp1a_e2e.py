#!/usr/bin/env python3
# SP1a 헤드리스 E2E 하니스 — orchestrator control plane(동시 통화 포함) 검증.
# 가비아에서 system python3(stdlib urllib)로 실행. CF 실자격으로 per-call publisher spawn→CF offer 까지 확인.
# 사용: ORCH_SECRET=<...> [E2E_BASE=http://127.0.0.1:8100] python3 _remote_sp1a_e2e.py
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get("E2E_BASE", "http://127.0.0.1:8100")
ORCH = os.environ.get("ORCH_SECRET", "")

def http(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode() or "{}"
            return r.status, json.loads(raw)
    except urllib.error.HTTPError as e:
        try:
            b = json.loads(e.read().decode() or "{}")
        except Exception:
            b = {}
        return e.code, b
    except Exception as e:
        return 0, {"_err": str(e)}

results = []
def check(name, cond, detail=""):
    results.append(cond)
    print(("PASS" if cond else "FAIL"), "-", name, ("| " + detail) if detail else "")

if not ORCH:
    print("FAIL - ORCH_SECRET env missing"); sys.exit(2)

# 0) 시작 시 잔여 통화 정리(클린 베이스라인)
_, pre = http("GET", "/oth-path", ORCH)
for c in pre.get("calls", []):
    http("DELETE", "/oth-path" + c["call_id"], ORCH)

# 1) 동시 2건 생성
sa, a = http("POST", "/oth-path", ORCH, {"cloneId": "10", "userId": "20", "idleVideoUrl": None})
sb, b = http("POST", "/oth-path", ORCH, {"cloneId": "11", "userId": "21", "idleVideoUrl": None})
ca, ta = a.get("callId"), a.get("subscribeToken")
cb, tb = b.get("callId"), b.get("subscribeToken")
check("create A 200", sa == 200, f"status={sa} callId={ca} detail={a if sa!=200 else ''}")
check("create B 200", sb == 200, f"status={sb} callId={cb} detail={b if sb!=200 else ''}")
check("distinct callIds", bool(ca and cb and ca != cb), f"{ca} vs {cb}")

# 2) live 2건
sl, lst = http("GET", "/oth-path", ORCH)
live = lst.get("calls", [])
ports = sorted(c.get("port") for c in live)
check("live == 2", len(live) == 2, f"count={len(live)} ports={ports}")
check("distinct ports", len(set(ports)) == len(ports) and len(ports) == 2, f"ports={ports}")

# 3) 각 구독 → offer_sdp 비어있지 않음
ssa, ra = http("POST", f"/oth-path", ta)
ssb, rb = http("POST", f"/oth-path", tb)
check("subscribe A offer_sdp", ssa == 200 and bool(ra.get("offer_sdp")), f"status={ssa} len={len(ra.get('offer_sdp') or '')}")
check("subscribe B offer_sdp", ssb == 200 and bool(rb.get("offer_sdp")), f"status={ssb} len={len(rb.get('offer_sdp') or '')}")

# 4) 교차 토큰(A 를 B 토큰으로) → 401
sc, _ = http("POST", f"/oth-path", tb)
check("cross-token -> 401", sc == 401, f"status={sc}")

# 5) teardown → ok, live 0
sda, _ = http("DELETE", f"/oth-path", ORCH)
sdb, _ = http("DELETE", f"/oth-path", ORCH)
check("teardown A ok", sda == 200, f"status={sda}")
check("teardown B ok", sdb == 200, f"status={sdb}")
_, lst2 = http("GET", "/oth-path", ORCH)
check("live == 0 after teardown", len(lst2.get("calls", [])) == 0, f"count={len(lst2.get('calls', []))}")

ok = all(results)
print("\n=== RESULT:", "ALL PASS" if ok else "SOME FAIL", f"({sum(results)}/{len(results)}) ===")
sys.exit(0 if ok else 1)
