from __future__ import annotations
import re
from datetime import datetime, timezone, timedelta

_KST = timezone(timedelta(hours=9))
_ENV_LINE = re.compile(r'^Environment="([^=]+)=(.*)"$')

def parse_dropin(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in text.splitlines():
        m = _ENV_LINE.match(line.strip())
        if m:
            out[m.group(1)] = m.group(2)
    return out

def read_running_env(mainpid: int, keys: list[str]) -> dict[str, str]:
    try:
        with open(f"/proc/{mainpid}/environ", "rb") as f:
            raw = f.read()
    except OSError:
        return {}
    env: dict[str, str] = {}
    for chunk in raw.split(b"\x00"):
        if b"=" in chunk:
            k, _, v = chunk.partition(b"=")
            env[k.decode(errors="replace")] = v.decode(errors="replace")
    return {k: env[k] for k in keys if k in env}

def drift(dropin: dict, running: dict, keys: list[str]) -> list[dict]:
    rows = []
    for k in keys:
        conf = dropin.get(k, "")
        if k not in running:
            state = "unknown"
        elif running.get(k, "") == conf:
            state = "match"
        else:
            state = "drift"
        rows.append({"env": k, "conf": conf, "running": running.get(k, ""), "state": state})
    return rows

def kst_now() -> str:
    return datetime.now(_KST).strftime("%Y-%m-%d %H:%M:%S KST")
