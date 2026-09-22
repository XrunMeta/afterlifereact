#!/usr/bin/env python3
"""학습 결과를 앱이 1회 다운로드할 음성 패키지로 묶는다.

가비아 `/data/afterlife/tts-finetune/` 에서 돌린다.

패키지 = 모델 ONNX + tokens.txt + manifest.json.
espeak-ng-data 는 넣지 않는다 — 이 모델은 character 프론트엔드라 필요 없다
(그래서 mimic3 경로의 18MB·파일 수천 개 배포 문제가 여기서는 아예 생기지 않는다).

manifest 의 sha256 은 앱이 다운로드 무결성을 확인하는 데 쓴다.
version 이 바뀌면 앱은 캐시를 버리고 다시 받는다.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from datetime import datetime, timezone, timedelta
from pathlib import Path

KST = timezone(timedelta(hours=9))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--clone-id", required=True)
    p.add_argument("--onnx", required=True)
    p.add_argument("--tokens", required=True)
    p.add_argument("--out-root", required=True, help="배포 루트 (voices/ 의 부모)")
    p.add_argument("--version", default=None, help="기본값: YYYYMMDD-HHMM (KST)")
    p.add_argument("--sample-rate", type=int, default=44100)
    p.add_argument("--note", default="")
    args = p.parse_args()

    version = args.version or datetime.now(KST).strftime("%Y%m%d-%H%M")
    out = Path(args.out_root) / "voices" / args.clone_id
    out.mkdir(parents=True, exist_ok=True)

    files = []
    for src, name in [(Path(args.onnx), "model.onnx"), (Path(args.tokens), "tokens.txt")]:
        dst = out / name
        shutil.copyfile(src, dst)
        files.append({"name": name, "size": dst.stat().st_size, "sha256": sha256(dst)})

    manifest = {
        "cloneId": args.clone_id,
        "version": version,
        "sampleRate": args.sample_rate,
        # 앱이 sherpa-onnx 초기화에 그대로 넘기는 값들.
        "modelFile": "model.onnx",
        "tokensFile": "tokens.txt",
        "modelType": "vits",
        # character 프론트엔드라 espeak 데이터가 필요 없다는 표시.
        "needsEspeakData": False,
        "files": files,
        "totalBytes": sum(f["size"] for f in files),
        "note": args.note,
    }

    (out / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"패키지: {out}")
    print(f"  version {version} · 총 {manifest['totalBytes'] / 1024 / 1024:.0f} MB")
    for f in files:
        print(f"  {f['name']:<12} {f['size'] / 1024 / 1024:7.2f} MB  {f['sha256'][:16]}…")


if __name__ == "__main__":
    main()
