"""ONNX 로 내보낼 수 있는 iSTFT.

MB-iSTFT-VITS 의 `TorchSTFT` 는 `torch.istft` = 복소수 연산이라 ONNX export 가
`RuntimeError: Unknown number type: complex` 로 죽는다(opset 13·17 모두).

같은 레포의 `STFT`(Prem Seetharaman 방식)는 `conv_transpose1d` 라 실수 연산이지만,
window 정규화를 **numpy 로 매 호출 계산**해서 트레이싱하면 그 시점의 프레임 수로 굳는다.
→ 길이가 다른 입력에서 틀린 오디오가 나온다.

그래서 basis 구성은 원본 `STFT` 를 그대로 물려받고, **정규화만 텐서 연산으로** 바꾼다.
window² 을 같은 stride 로 overlap-add 하는 것이 window_sumsquare 와 수학적으로 같다.
"""
from __future__ import annotations

import numpy as np
import torch
import torch.nn.functional as F
from librosa.util import pad_center
from scipy.signal import get_window
from stft import STFT

class OnnxSTFT(STFT):
    """`TorchSTFT` 자리에 그대로 끼울 수 있다 — 생성자·`inverse` 시그니처가 같다."""

    def __init__(self, filter_length: int = 800, hop_length: int = 200,
                 win_length: int = 800, window: str = "hann") -> None:
        super().__init__(filter_length, hop_length, win_length, window)

        win = get_window(window, win_length, fftbins=True).astype(np.float32)
        win = pad_center(win, size=filter_length)
        # [1, 1, filter_length] — conv_transpose1d 로 overlap-add 하기 위한 커널
        self.register_buffer("window_sq", torch.from_numpy(win ** 2).float().view(1, 1, -1))

    def transform(self, input_data):  # 학습 경로에서는 쓰지 않는다
        return super().transform(input_data)

    def inverse(self, magnitude: torch.Tensor, phase: torch.Tensor) -> torch.Tensor:
        recombine = torch.cat(
            [magnitude * torch.cos(phase), magnitude * torch.sin(phase)], dim=1
        )

        out = F.conv_transpose1d(
            recombine, self.inverse_basis, stride=self.hop_length, padding=0
        )

        # window² 의 overlap-add. 프레임 수를 입력에서 받으므로 길이에 독립적이다.
        ones = torch.ones(
            magnitude.size(0), 1, magnitude.size(-1),
            device=magnitude.device, dtype=magnitude.dtype,
        )
        window_sum = F.conv_transpose1d(
            ones, self.window_sq, stride=self.hop_length, padding=0
        )

        # 원본은 0 이 아닌 위치만 골라 나눈다. 여기서는 eps 를 더해 같은 효과를 내되
        # 분모가 0 에 가까운 양 끝은 어차피 아래에서 잘라낸다.
        out = out / (window_sum + 1e-8)
        out = out * (float(self.filter_length) / self.hop_length)

        half = self.filter_length 
        return out[:, :, half:-half]

    def forward(self, input_data):
        magnitude, phase = self.transform(input_data)
        return self.inverse(magnitude, phase)

def patch(models_module) -> None:
    """`models.TorchSTFT` 를 교체한다. `SynthesizerTrn` 을 만들기 **전에** 부를 것."""
    models_module.TorchSTFT = OnnxSTFT
