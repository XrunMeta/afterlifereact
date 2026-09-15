#!/usr/bin/env python3
"""MB-iSTFT-VITS 체크포인트(.pth) -> sherpa-onnx 가 읽는 ONNX.

가비아 `/data/afterlife/tts-finetune/` 에서 돌린다. 로컬용이 아니다.

sherpa-onnx 의 `scripts/vits/export-onnx-ljs.py` 규약을 그대로 따른다:
  입력  x, x_length, noise_scale, length_scale, noise_scale_w
  출력  y
  메타  model_type/sample_rate/add_blank/n_speakers/punctuation

MB-iSTFT-VITS 는 표준 VITS 의 디코더 변형(Multi-band + iSTFT)이라
`infer()` 의 입출력 인터페이스가 같다 — 그래서 같은 규약으로 내보낼 수 있다는 게
이 스크립트가 검증하려는 가설이다.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import onnx
import torch

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--code", required=True, help="MB-iSTFT-VITS-Korean 레포 경로")
    parser.add_argument("--config", required=True)
    parser.add_argument("--checkpoint", required=True, help="G_*.pth")
    parser.add_argument("--out", required=True, help="출력 .onnx")
    parser.add_argument("--tokens", default=None, help="tokens.txt 출력 경로")
    parser.add_argument("--opset", type=int, default=13)
    return parser.parse_args()

class OnnxModel(torch.nn.Module):
    """infer() 의 첫 반환값(o)만 내보낸다. o_mb·attn 등은 런타임이 쓰지 않는다."""

    def __init__(self, model: torch.nn.Module) -> None:
        super().__init__()
        self.model = model

    def forward(self, x, x_lengths, noise_scale, length_scale, noise_scale_w):
        audio = self.model.infer(
            x=x,
            x_lengths=x_lengths,
            sid=None,
            noise_scale=noise_scale,
            length_scale=length_scale,
            noise_scale_w=noise_scale_w,
        )[0]

        # 🔴 이 체크포인트는 use_sdp=False 라 noise_scale_w 를 실제로 쓰지 않는다.
        # 그대로 두면 상수 폴딩으로 입력이 사라지고, sherpa-onnx 가 그 입력을 넘길 때
        # "Invalid input name: noise_scale_w" 로 거부당한다.
        # 0 을 곱해 그래프에 남겨둔다 — 수치에는 영향이 없다.
        return audio + noise_scale_w.reshape(1, 1, 1) * 0.0

def add_meta_data(filename: str, meta_data: dict) -> None:
    model = onnx.load(filename)
    for key, value in meta_data.items():
        entry = model.metadata_props.add()
        entry.key = key
        entry.value = str(value)
    onnx.save(model, filename)

def write_tokens(symbols: list[str], path: Path) -> None:
    """sherpa-onnx tokens.txt — 한 줄에 `<symbol> <id>`.

    공백 심볼은 리터럴로 쓰면 파싱이 깨지므로 sherpa-onnx 규약대로 그대로 두되,
    줄 맨 앞의 한 글자를 심볼로 읽는 파서를 전제한다.
    """
    with path.open("w", encoding="utf-8") as f:
        for i, symbol in enumerate(symbols):
            f.write(f"{symbol} {i}\n")

def register_lift_fresh(opset: int) -> None:
    """`aten::lift_fresh` 는 ONNX 심볼릭이 없어 export 를 멈춘다.

    이 연산은 "값을 새 텐서로 들어올린다"는 뜻이라 그래프상으로는 항등이다.
    그대로 통과시켜도 수치가 달라지지 않는다.
    """
    from torch.onnx import register_custom_op_symbolic

    def identity(g, x):
        return x

    register_custom_op_symbolic("aten::lift_fresh", identity, opset)

def verify_istft(torch_cls, onnx_cls, n_fft: int = 16, hop: int = 4) -> None:
    """교체한 iSTFT 가 원본과 같은 오디오를 내는지 확인한다.

    여기서 어긋나면 export 는 성공해도 소리가 망가진다 — 반드시 먼저 본다.
    """
    torch.manual_seed(0)
    magnitude = torch.rand(1, n_fft 
    phase = (torch.rand(1, n_fft 

    with torch.no_grad():
        reference = torch_cls(filter_length=n_fft, hop_length=hop, win_length=n_fft).inverse(magnitude, phase)
        candidate = onnx_cls(filter_length=n_fft, hop_length=hop, win_length=n_fft).inverse(magnitude, phase)

    length = min(reference.shape[-1], candidate.shape[-1])
    a, b = reference[..., :length], candidate[..., :length]
    max_diff = (a - b).abs().max().item()
    scale = a.abs().max().item() or 1.0
    print(f"iSTFT 검증: 원본 {tuple(reference.shape)} vs 교체 {tuple(candidate.shape)} · "
          f"최대오차 {max_diff:.3e} (신호 최대 {scale:.3f}, 상대 {max_diff / scale:.2e})")
    if max_diff / scale > 1e-3:
        raise SystemExit("iSTFT 교체본이 원본과 다르다 — 소리가 망가진다. 중단.")

def main() -> None:
    args = parse_args()
    sys.path.insert(0, args.code)

    import commons  # noqa: F401  (models 가 참조)
    import models as models_module
    import utils
    from models import SynthesizerTrn
    from text import text_to_sequence
    from text.symbols import symbols

    from onnx_istft import OnnxSTFT, patch

    # 🔴 복소수 iSTFT 를 실수 연산으로 교체한다. SynthesizerTrn 을 만들기 전에 해야 한다.
    verify_istft(models_module.TorchSTFT, OnnxSTFT)
    patch(models_module)
    register_lift_fresh(args.opset)

    hps = utils.get_hparams_from_file(args.config)

    net_g = SynthesizerTrn(
        len(symbols),
        hps.data.filter_length 
        hps.train.segment_size 
        **hps.model,
    )
    net_g.eval()
    utils.load_checkpoint(args.checkpoint, net_g, None)

    # 더미 입력. 실제 한국어를 넣어야 그래프의 분기가 실사용과 같아진다.
    sequence = text_to_sequence("안녕하세요.", hps.data.text_cleaners)
    if hps.data.add_blank:
        sequence = commons.intersperse(sequence, 0)
    x = torch.LongTensor(sequence).unsqueeze(0)
    x_length = torch.tensor([x.shape[1]], dtype=torch.int64)
    noise_scale = torch.tensor([0.667], dtype=torch.float32)
    length_scale = torch.tensor([1.0], dtype=torch.float32)
    noise_scale_w = torch.tensor([0.8], dtype=torch.float32)

    model = OnnxModel(net_g)

    torch.onnx.export(
        model,
        (x, x_length, noise_scale, length_scale, noise_scale_w),
        args.out,
        opset_version=args.opset,
        input_names=["x", "x_length", "noise_scale", "length_scale", "noise_scale_w"],
        output_names=["y"],
        dynamic_axes={
            "x": {0: "N", 1: "L"},
            "x_length": {0: "N"},
            "y": {0: "N", 2: "L"},
        },
    )

    add_meta_data(
        args.out,
        {
            "model_type": "vits",
            "comment": "MB-iSTFT-VITS Korean (afterlife T-558)",
            "language": "Korean",
            "add_blank": int(hps.data.add_blank),
            "n_speakers": int(hps.data.n_speakers),
            "sample_rate": int(hps.data.sampling_rate),
            "punctuation": " ".join(list(",.!?…~")),
            # 🔴 이게 없으면 sherpa-onnx 가 lexicon 을 요구하며 프로세스를 죽인다
            # ("Not a model using characters as modeling unit").
            # 이 모델의 모델링 단위는 한글 자모 문자라서 character 프론트엔드가 맞다.
            "frontend": "characters",
            # OfflineTtsCharacterFrontend 가 읽는 값들.
            # VITS 원본은 bos/eos 를 쓰지 않고, blank 는 pad(id 0)이다.
            "use_eos_bos": 0,
            "bos_id": 0,
            "eos_id": 0,
            "blank_id": 0,
        },
    )

    if args.tokens:
        write_tokens(list(symbols), Path(args.tokens))

    size_mb = Path(args.out).stat().st_size / 1024 / 1024
    print(f"wrote {args.out} ({size_mb:.0f} MB)")
    print(f"  vocab {len(symbols)} · sample_rate {hps.data.sampling_rate} · add_blank {hps.data.add_blank}")
    print(f"  더미 토큰 길이 {x.shape[1]}")

if __name__ == "__main__":
    main()
