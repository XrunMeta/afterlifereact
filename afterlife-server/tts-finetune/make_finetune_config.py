#!/usr/bin/env python3
"""베이스 config 를 9053 화자 적응용으로 고친다.

가비아 `/data/afterlife/tts-finetune/` 에서 돌린다.

모델 구조(`model` 섹션)와 오디오 규격(sampling_rate·hop 등)은 **절대 건드리지 않는다** —
베이스 가중치가 그 규격으로 학습됐기 때문에 바꾸면 파인튜닝이 아니라 파괴가 된다.
바꾸는 것은 데이터 경로와 학습 스케줄뿐이다.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--base", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--train-list", required=True)
    p.add_argument("--val-list", required=True)
    p.add_argument("--batch-size", type=int, default=16)
    p.add_argument("--learning-rate", type=float, default=1e-4)
    p.add_argument("--eval-interval", type=int, default=500)
    p.add_argument("--fp16", action="store_true", default=True, help="mixed precision (float16) 학습 · GPU 처리량 1.5-2배 · default True")
    p.add_argument("--no-fp16", action="store_false", dest="fp16", help="fp16 끄기 (기본은 켜짐)")
    args = p.parse_args()

    config = json.loads(Path(args.base).read_text(encoding="utf-8"))

    config["data"]["training_files"] = args.train_list
    config["data"]["validation_files"] = args.val_list

    # 418 클립뿐이라 배치를 줄여야 에폭당 스텝이 생긴다(32면 13스텝/에폭).
    config["train"]["batch_size"] = args.batch_size
    # 화자 적응이라 베이스 학습률(2e-4)을 그대로 쓰면 이미 수렴한 가중치를 흔든다.
    config["train"]["learning_rate"] = args.learning_rate
    config["train"]["eval_interval"] = args.eval_interval
    # T-704 (2026-09-07): fp16 mixed precision 활성 · 학습 속도 1.5-2배 개선 (naat 지시)
    config["train"]["fp16_run"] = args.fp16
    config["train"]["log_interval"] = 100

    Path(args.out).write_text(json.dumps(config, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"wrote {args.out}")
    print(f"  train {config['data']['training_files']}")
    print(f"  batch {config['train']['batch_size']} · lr {config['train']['learning_rate']}"
          f" · eval {config['train']['eval_interval']} · fp16 {config['train']['fp16_run']}")
    print(f"  (불변) sampling_rate {config['data']['sampling_rate']} · hop {config['data']['hop_length']}"
          f" · mb_istft {config['model']['mb_istft_vits']} · subbands {config['model']['subbands']}")


if __name__ == "__main__":
    main()
