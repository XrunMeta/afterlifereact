#!/usr/bin/env python3
"""records_report.py — 기록 디렉토리에서 응답 상태를 3분류 진단.

usage: python records_report.py [RECORDS_ROOT] [CLONE_ID]
  RECORDS_ROOT 기본 /data/records. CLONE_ID 생략 시 전체 클론.

분류:
  정상     : input + answer(answer_chars>0)
  처리실패 : input + meta 있으나 answer_chars==0 (파이프라인 중단)
  미응답   : input 만, meta 없음 (finalize 미호출 = 진짜 누락)
"""
import json
import os
import sys


def _load_meta(cdir: str, ts: str) -> dict | None:
    p = os.path.join(cdir, f"{ts}-meta.json")
    if not os.path.isfile(p):
        return None
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def _input_text(cdir: str, ts: str) -> str:
    p = os.path.join(cdir, f"{ts}-input.txt")
    try:
        with open(p, encoding="utf-8") as f:
            return f.read().split("---\n", 1)[-1].strip()
    except OSError:
        return "(읽기 실패)"


def report(root: str, only_clone: str | None = None) -> int:
    if not os.path.isdir(root):
        print(f"records root 없음: {root}")
        return 1
    clones = [only_clone] if only_clone else sorted(os.listdir(root))
    for cid in clones:
        cdir = os.path.join(root, cid)
        if not os.path.isdir(cdir):
            continue
        names = os.listdir(cdir)
        ts_all = sorted({n.split("-")[0] for n in names if n.endswith("-input.txt")})
        ok = fail = drop = 0
        problems = []
        for ts in ts_all:
            # MAJOR 4: answer 산출물 우선 분류 — meta 실패해도 응답은 나온 것
            apath = os.path.join(cdir, f"{ts}-answer.txt")
            wpath = os.path.join(cdir, f"{ts}-answer.wav")
            has_answer_txt = os.path.isfile(apath) and os.path.getsize(apath) > 0
            has_wav = os.path.isfile(wpath)
            meta = _load_meta(cdir, ts)
            if has_answer_txt or has_wav:
                ok += 1  # 응답 산출물 존재 = 정상(meta 실패해도 응답은 나옴)
            elif meta is not None:
                # finalize는 됐으나 응답 산출물 없음(토큰0) = 처리실패
                fail += 1
                problems.append((ts, "처리실패", _input_text(cdir, ts)))
            else:
                # input만, 산출물·meta 모두 없음 = 미응답(finalize 미호출)
                drop += 1
                problems.append((ts, "미응답", _input_text(cdir, ts)))
        print(f"[{cid}] 턴 {len(ts_all)} | 정상 {ok} | 처리실패 {fail} | 미응답 {drop}")
        for ts, kind, txt in problems:
            meta = _load_meta(cdir, ts)
            extra = ""
            if meta:
                extra = f" offer_to_say_ms={meta.get('offer_to_say_ms')} mode={meta.get('mode')}"
            print(f"    {kind} ts={ts} input={txt!r}{extra}")
    return 0


if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else "/data/records"
    clone = sys.argv[2] if len(sys.argv) > 2 else None
    sys.exit(report(root, clone))
