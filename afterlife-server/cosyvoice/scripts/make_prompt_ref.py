"""make_prompt_ref.py — CosyVoice 전용 짧은 프롬프트 쌍(voice_prompt.wav + ref_prompt.txt) 생성.

왜 필요한가
-----------
CosyVoice2 는 종료 토큰을 못 뽑으면 max_len(= 텍스트토큰 × max_token_text_ratio 20)까지
생성한다. "안녕하세요"(4토큰)면 80토큰 ÷ 25Hz = 3.20초의 의미 없는 소리가 나온다.
inference_zero_shot 이 직접 경고하듯("synthesis text too short than prompt text"),
프롬프트 텍스트가 길수록 짧은 발화가 무너진다.

실측(clone 9128, "안녕하세요" 8회):
  ref 70.1초 / 46자 →  1.76 2.28 2.24 2.08 2.04 2.00 2.20 2.20   재합성 잦음
  ref  3.2초 / 13자 →  0.92 1.80 1.24 1.00 1.08 1.24 1.16 1.08   재합성 1회

무엇을 하는가
-------------
1. voice.wav 에서 **말이 있는 구간만** 고른다(히즈키 지시). 앞뒤 무음을 버리고,
   발화가 시작되는 지점부터 목표 길이만큼 잘라낸다.
2. 잘라낸 구간을 STT 로 전사해 ref_prompt.txt 에 쓴다.
   🔴 오디오와 텍스트는 반드시 **같은 구간**이어야 한다. 기존 ref_text.txt 를
   재사용하면 안 된다 — 그건 앞 10초의 전사라 잘라낸 구간과 어긋나고, 그 불일치가
   바로 폭주의 원인이다.

voice.wav 는 건드리지 않는다 — qwen3tts·openvoice 가 같은 파일을 쓴다.

사용:
    python3 make_prompt_ref.py <clone_id> [<clone_id> ...]
    python3 make_prompt_ref.py --all
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys

import config
from clone_ref import ref_audio_path, prompt_pair_paths

# 목표 길이(초). 실측에서 3.2초가 가장 안정적이었고, 음색 학습을 위해 약간의 여유를 둔다.
TARGET_SEC = float(os.environ.get("COSYVOICE_PROMPT_SEC", "4.0"))
# 무음 판정 임계. -40dB 는 ref 분석에서 발화/무음이 깨끗이 갈린 값.
SILENCE_DB = os.environ.get("COSYVOICE_PROMPT_SILENCE_DB", "-40dB")
# 이보다 짧은 무음은 문장 내 호흡이라 자르지 않는다.
SILENCE_MIN = float(os.environ.get("COSYVOICE_PROMPT_SILENCE_MIN", "0.35"))
# 문장 끝 무음을 이만큼 물고 간다. 마지막 음절 바로 뒤에서 끊으면 모델이 그 음절을
# 이어받아 생성 앞에 흘린다("박영미입니다." → "다~"). 무음이 곧 종결 신호다.
TAIL_SILENCE_SEC = float(os.environ.get("COSYVOICE_PROMPT_TAIL_SILENCE", "0.35"))
# 앞쪽 공백을 걷어낼 때 쓰는 임계. 무음 판정(-40dB)보다 민감하게 잡아 첫 소리 직전까지
# 바짝 붙인다. 여백이 남으면 모델이 앞 음절을 되풀이했다(히즈키 실청: "다" 반복).
LEAD_TRIM_DB = os.environ.get("COSYVOICE_PROMPT_LEAD_TRIM_DB", "-45dB")
# 프롬프트 최소 길이(초). 마지막 유성 구간을 버리는 만큼 짧아지므로 하한이 필요하다.
MIN_PROMPT_SEC = float(os.environ.get("COSYVOICE_PROMPT_MIN_SEC", "1.2"))
STT_URL = os.environ.get("PRETHIRD_STT_URL", "http://127.0.0.1:8202")

_SIL_START = re.compile(r"silence_start:\s*([0-9.]+)")
_SIL_END = re.compile(r"silence_end:\s*([0-9.]+)")


def _run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True)
    return (p.stdout or "") + (p.stderr or "")


def silences(path: str) -> tuple[list[float], list[float]]:
    """무음 구간의 (시작들, 끝들). 문장 경계를 찾는 재료다."""
    out = _run([
        "ffmpeg", "-hide_banner", "-i", path,
        "-af", f"silencedetect=noise={SILENCE_DB}:d={SILENCE_MIN}",
        "-f", "null", "/dev/null",
    ])
    return (
        [float(m) for m in _SIL_START.findall(out)],
        [float(m) for m in _SIL_END.findall(out)],
    )


def speech_start(path: str) -> float:
    """첫 발화가 시작되는 시각(초). 앞부분 무음을 건너뛴다.

    silencedetect 는 무음 **구간**을 알려준다. 0 근처에서 시작하는 무음이 있으면
    그 끝이 곧 발화 시작점이다. 없으면 파일 처음부터 말이 있다는 뜻이다.
    """
    starts, ends = silences(path)
    if starts and ends and starts[0] < 0.3:
        return ends[0]
    return 0.0


def pick_end(path: str, start: float, target: float) -> float:
    """자를 지점(초, 절대시각)을 고른다 — **문장 경계에서 끊기 위해**.

    목표 길이에서 기계적으로 자르면 문장 한복판에서 끊긴다. 그러면 프롬프트 텍스트가
    "…오늘 하루는 다" 처럼 미완으로 끝나고, CosyVoice 는 프롬프트의 **연속**으로
    생성하므로 그 뒷말을 이어붙인다 — 실사용에서 클론이 말 앞에 "다오~" 같은 추임새를
    붙였다(히즈키 보고 2026-08-13).

    문장 끝에는 대개 무음이 온다. 그 무음 지점을 끝으로 삼으면 문장 경계에 맞춰 끊긴다.

    🔴 **마지막 유성 구간은 버린다**(히즈키 지시 2026-08-13).
    무음 지점에서 끊어도 그 직전 음절이 생성 앞에 새어 나왔다("…박영미입니다." →
    앞에 "다"). 꼬리 무음을 물려도 12분의 1 확률로 남았다. 마지막 소리를 아예
    포함하지 않으면 샐 음절 자체가 없다 —

        [안녕하세요] [공백] [박영미입니다] [무음]    ← 끝 음절이 샌다
        [안녕하세요] [공백]                          ← 마지막 소리 앞 공백에서 끊는다

    그래서 마지막 무음이 아니라 **뒤에서 두 번째 무음**을 고른다. 후보가 하나뿐이면
    (문장이 하나뿐이면) 그것을 쓴다 — 더 줄이면 음색을 학습할 재료가 없어진다.
    """
    limit = start + target
    starts, _ = silences(path)
    # MIN_PROMPT_SEC 보다 이른 무음은 후보에서 뺀다 — 프롬프트가 너무 짧으면 음색이 무너진다.
    candidates = sorted(s for s in starts if start + MIN_PROMPT_SEC < s <= limit)
    if not candidates:
        return limit
    chosen = candidates[-2] if len(candidates) >= 2 else candidates[-1]
    # 무음이 **시작되는** 지점에서 딱 끊으면 직전 음절에 바짝 붙는다.
    # 종결 신호가 되도록 무음을 조금 물고 간다(TAIL_SILENCE_SEC).
    return min(chosen + TAIL_SILENCE_SEC, limit + TAIL_SILENCE_SEC)


def cut(src: str, dst: str, start: float, dur: float) -> bool:
    """start 부터 dur 초를 잘라 dst 에 쓴다.

    앞쪽: **공백을 샘플 단위로 완전히 걷어낸다**(히즈키 지시 2026-08-13).
    speech_start 는 silencedetect 기반이라 최소 무음 길이(SILENCE_MIN 0.35초) 해상도
    만큼 여백이 남는다. 그 여백이 남아 있으면 프롬프트가 무음으로 시작하고, 모델이
    앞 음절을 되풀이해 "다다…" 처럼 흘렸다. silenceremove 로 첫 소리 직전까지 자른다.

    🔴 뒤쪽: 무음을 **제거하지 않는다.** 문장 끝 무음이 곧 "여기서 끝났다"는 종결
    신호이기 때문이다. 처음에는 areverse+silenceremove 로 꼬리 무음을 걷어냈는데,
    그랬더니 프롬프트가 마지막 음절에 딱 붙어 끝나 모델이 그 음절을 이어받았다 —
    "박영미입니다." 로 끝나는 프롬프트에서 생성 앞에 "다" 가 새어 나왔다
    (히즈키 실청 2026-08-13, 샘플2). silenceremove 는 앞에서만 지우므로 꼬리는 안전하다.
    """
    af = (
        f"silenceremove=start_periods=1:start_threshold={LEAD_TRIM_DB}"
        f":start_silence=0:detection=rms"
    )
    _run([
        "ffmpeg", "-hide_banner", "-v", "error", "-ss", f"{start:.3f}",
        "-t", f"{dur:.3f}", "-i", src, "-af", af, "-c:a", "pcm_s16le", dst, "-y",
    ])
    return os.path.isfile(dst) and os.path.getsize(dst) > 1000


def duration(path: str) -> float:
    out = _run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", path,
    ]).strip()
    try:
        return float(out.splitlines()[0])
    except (ValueError, IndexError):
        return 0.0


# STT 의 /transcribe_path 는 전사 결과를 out_clone_id 의 ref_text.txt 에도 **쓴다**.
# 우리는 응답 본문만 쓰고 싶으므로 저장은 이 임시 클론으로 흘려보낸다 — 진짜 클론의
# ref_text.txt(기존 자산)를 건드리면 폴백 경로가 오염된다.
STT_SINK_CLONE = os.environ.get("COSYVOICE_PROMPT_STT_SINK", "zz-stt-sink")


def transcribe(wav_path: str) -> str | None:
    """잘라낸 구간을 STT 로 전사. 실패하면 None(호출자가 skip)."""
    import urllib.error
    import urllib.request

    payload = json.dumps({"wav_path": wav_path, "out_clone_id": STT_SINK_CLONE}).encode()
    req = urllib.request.Request(
        f"{STT_URL}/transcribe_path",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # 422 = 전사가 비었거나 한글 비율 미달(sanity). 자른 구간이 나쁘다는 뜻.
        print(f"    STT 거부({exc.code}): {exc.read()[:120]!r}")
        return None
    except Exception as exc:  # noqa: BLE001 — 어떤 실패든 상위에서 skip 처리
        print(f"    STT 실패: {exc}")
        return None
    return clean_prompt_text(data.get("ref_text") or "")


def clean_prompt_text(text: str) -> str | None:
    """프롬프트 텍스트 정제. 빈 문자열이면 None.

    끝의 말줄임표를 떼는 것이 핵심이다. 목표 길이에서 자르면 문장 중간에서 끊기고,
    STT 는 그 자리에 "..." 를 붙인다. CosyVoice 는 프롬프트 텍스트를 그대로 조건으로
    받으므로 말줄임표를 "늘어짐"으로 해석한다 — 실측에서 이것만 떼도 같은 문장이
    3.20초에서 1.88초로 줄었다.
    """
    text = (text or "").strip()
    # "...", "…", 그리고 뒤에 붙은 공백/마침표 조합까지 함께 제거.
    text = re.sub(r"[.…\s]*(?:\.{2,}|…)[.…\s]*$", "", text).strip()
    return text or None


def build(clone_id: str, ref_root: str | None = None) -> bool:
    src = ref_audio_path(clone_id, ref_root)
    if not os.path.isfile(src):
        print(f"[{clone_id}] voice.wav 없음 — skip")
        return False

    wav_dst, txt_dst = prompt_pair_paths(clone_id, ref_root)
    start = speech_start(src)
    total = duration(src)
    if total - start < 1.0:
        print(f"[{clone_id}] 발화 구간이 너무 짧음({total - start:.1f}s) — skip")
        return False

    # 원본(voice.raw·voice.wav)은 건드리지 않는다 — qwen3tts·openvoice 가 voice.wav 를
    # 그대로 쓴다. 잘라낸 결과는 새 파일로만 남긴다.
    #
    # wav 를 먼저 제자리에 쓰고 텍스트를 나중에 쓴다. STT(/transcribe_path)가 REF_ROOT
    # 아래 경로만 받기 때문이고, 그 사이의 중간 상태(wav 만 있고 txt 없음)는 ref_pair 가
    # 쌍 미완으로 보고 기존 자산으로 폴백하므로 안전하다(test_클론_ref_pair 로 고정).
    end = min(pick_end(src, start, TARGET_SEC), total)
    if not cut(src, wav_dst, start, max(end - start, 1.0)):
        print(f"[{clone_id}] 자르기 실패 — skip")
        return False
    text = transcribe(wav_dst)
    if not text:
        print(f"[{clone_id}] 전사 실패 — 프롬프트 wav 제거하고 기존 ref 유지")
        # 짝이 안 맞는 wav 를 남기면 다음 실행에서 오해할 여지가 있어 지운다.
        try:
            os.unlink(wav_dst)
        except OSError:
            pass
        return False
    with open(txt_dst, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"[{clone_id}] ok  {duration(wav_dst):.2f}s / {len(text)}자  ⟪{text[:40]}⟫")
    return True


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    root = config.REF_ROOT
    ids = (
        sorted(
            d for d in os.listdir(root)
            if os.path.isfile(os.path.join(root, d, "voice.wav"))
        )
        if argv[0] == "--all"
        else argv
    )
    ok = 0
    for cid in ids:
        if build(cid):
            ok += 1
    print(f"\n완료: {ok}/{len(ids)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
