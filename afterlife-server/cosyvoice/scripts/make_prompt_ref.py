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
1. voice.wav 에서 **말이 있는 구간만** 고른다(히즈키 지시). 앞 무음을 버리고,
   발화 8초가 지난 뒤 처음 나오는 쉼에서 자른다(AFL-1002). 30초까지 쉼이 없거나
   녹음이 15초가 안 되면 자르지 않고 실패한다 — 말 중간에서 끊긴 견본이 단어 반복을 부른다.
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

import io
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

import config
from clone_ref import ref_audio_path, prompt_pair_paths

# 자르기 규칙(AFL-1002, 히즈키 결정 2026-10-10):
#   - 녹음(발화)은 RECORD_MIN_SEC 이상이어야 한다.
#   - 통화용 견본은 발화 CUT_AFTER_SEC 가 지난 뒤 처음 나오는 쉼에서 자른다. 15초로 잘랐더니
#     견본이 길어 문장마다 응답이 0.5~0.6초 느려져(A/B 3회차) 8초로 줄였다.
#   - MAX_PROMPT_SEC 까지 쉼이 없으면 자르지 않고 실패한다(기계 절단 금지).
#     30초는 CosyVoice 가 받는 프롬프트 상한이기도 하다.
RECORD_MIN_SEC = float(os.environ.get("COSYVOICE_PROMPT_RECORD_MIN_SEC", "15.0"))
CUT_AFTER_SEC = float(os.environ.get("COSYVOICE_PROMPT_CUT_AFTER_SEC", "8.0"))
MAX_PROMPT_SEC = float(os.environ.get("COSYVOICE_PROMPT_MAX_SEC", "30.0"))
# 무음 판정 임계. -40dB 는 ref 분석에서 발화/무음이 깨끗이 갈린 값.
SILENCE_DB = os.environ.get("COSYVOICE_PROMPT_SILENCE_DB", "-40dB")
# 이보다 짧은 무음은 문장 내 호흡이라 자르지 않는다. 0.35 였을 때 프리셋 9520(문장 사이 쉼
# 0.25~0.34초)에서 쉼을 하나도 못 찾아 기계 절단으로 빠졌다 → 0.2.
SILENCE_MIN = float(os.environ.get("COSYVOICE_PROMPT_SILENCE_MIN", "0.2"))
# 문장 끝 무음을 이만큼 물고 간다(쉼이 더 짧으면 쉼 길이까지만). 마지막 음절 바로 뒤에서
# 끊으면 모델이 그 음절을 이어받아 생성 앞에 흘린다("박영미입니다." → "다~").
TAIL_SILENCE_SEC = float(os.environ.get("COSYVOICE_PROMPT_TAIL_SILENCE", "0.35"))
# 앞쪽 공백을 걷어낼 때 쓰는 임계. 무음 판정(-40dB)보다 민감하게 잡아 첫 소리 직전까지
# 바짝 붙인다. 여백이 남으면 모델이 앞 음절을 되풀이했다(히즈키 실청: "다" 반복).
LEAD_TRIM_DB = os.environ.get("COSYVOICE_PROMPT_LEAD_TRIM_DB", "-45dB")
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


def pick_end(path: str, start: float, total: float) -> tuple[float | None, str]:
    """자를 지점(초, 절대시각)과 사유를 고른다 — **문장 경계에서만 끊는다**.

    규칙(AFL-1002): 녹음이 RECORD_MIN_SEC 이상이면, 발화 시작 후 CUT_AFTER_SEC 가 지난 뒤
    **처음 나오는 쉼**에서 끊는다.
    반환: (끝 시각, "ok") 또는 (None, "too_short" | "no_pause").

    🔴 쉼을 못 찾으면 자르지 않는다. 예전에는 목표 길이(4초)에서 기계적으로 잘랐고,
    프리셋 9520 견본이 "…되었네요 오늘따라 당신과" 처럼 말 중간에서 끊겨 텍스트와
    어긋났다 — 통화에서 "잘 잘 잘…" 단어 반복의 원인이었다(AFL-1002).
    실패 사유는 재녹음 안내(AFL-1005)에 그대로 쓴다.
    """
    if total - start < RECORD_MIN_SEC:
        return None, "too_short"
    starts, ends = silences(path)
    end = _end_after(starts, ends, start, total)
    return (end, "ok") if end is not None else (None, "no_pause")


def _end_after(starts: list[float], ends: list[float], start: float, total: float) -> float | None:
    """start 기준 CUT_AFTER_SEC 뒤 처음 나오는 쉼에서의 끝 시각(꼬리 무음 포함). 없으면 None."""
    lo, hi = start + CUT_AFTER_SEC, start + MAX_PROMPT_SEC
    for i, s in enumerate(starts):
        if lo <= s <= hi:
            # 쉼이 끝나지 않은 채 파일이 끝나면 ffmpeg 가 silence_end 를 안 줄 수 있다.
            gap = (ends[i] if i < len(ends) else total) - s
            # 종결 신호가 되도록 쉼을 물고 가되, 쉼보다 길게 물면 다음 말 첫소리가 섞인다.
            return s + min(TAIL_SILENCE_SEC, gap)
    return None


def candidate_windows(path: str, start: float, total: float, n: int) -> list[tuple[float, float]]:
    """견본 후보 창 (시작, 끝) 최대 n 개 (AFL-1059).

    첫 후보는 pick_end 와 같은 창(15초 검사 포함). 다음 후보는 이전 창 시작 뒤 처음 나오는
    쉼의 끝(문장 경계)에서 시작하고 끝은 같은 규칙으로 정한다. 창 끝이 녹음을 넘으면 멈춘다.
    """
    first, _ = pick_end(path, start, total)
    if first is None:
        return []
    starts, ends = silences(path)
    wins = [(start, first)]
    while len(wins) < n:
        prev = wins[-1][0]
        nxt = next((e for s, e in zip(starts, ends) if s > prev), None)
        if nxt is None:
            break
        end = _end_after(starts, ends, nxt, total)
        if end is None or end > total:
            break
        wins.append((nxt, end))
    return wins


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


# ── AFL-1059 견본 후보 시험 합성 ───────────────────────────────────────────────
# 폭주는 대본보다 개별 견본에 좌우된다(2026-10-26 측정). 후보마다 짧은 질문을 재합성 없이
# 1차 생성 그대로 받아, 늘어진 만큼을 점수로 매기고 가장 낮은 후보를 쓴다.
PROBE_SENTENCES = [
    "너는 뭐 먹었어?", "뭐 하고 있었어?", "무슨 일 있어?", "돌아왔네.", "잘 들려?", "밥은 먹었어?",
]
PROBE_URL = (os.environ.get("COSYVOICE_PROBE_URL")
             or os.environ.get("PRETHIRD_TTS_URL") or "http://127.0.0.1:8203")
PROBE_TIMEOUT_SEC = 30
# 점수 기준 상수. 엔진 폭주 가드의 라이브 값(cosyvoice drop-in COSYVOICE_RAMBLE_BASE_SEC=0.9)과 맞춘다.
# prebuild 는 prethird 환경으로 이 스크립트를 부르므로 엔진 env 가 없고 config 기본 1.8 이 쓰였다 —
# 짧은 질문이 3초쯤 늘어져도 0점이라 후보를 못 가렸다(2026-10-27 검증).
PROBE_RAMBLE_BASE_SEC = float(os.environ.get("COSYVOICE_PROBE_RAMBLE_BASE_SEC", "0.9"))


def probe_durations(probe_id: str, sentences: list[str], url: str) -> list[float] | None:
    """문장마다 1차 생성(ramble_retries=0) 길이(초). 하나라도 실패하면 None."""
    import soundfile as sf

    out = []
    for s in sentences:
        body = json.dumps({"text": s, "clone_id": probe_id, "ramble_retries": 0}).encode()
        req = urllib.request.Request(
            f"{url}/tts/kr", data=body, headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=PROBE_TIMEOUT_SEC) as resp:
                out.append(float(sf.info(io.BytesIO(resp.read())).duration))
        except Exception as exc:  # noqa: BLE001 — 어떤 실패든 이 후보 점수 없음
            print(f"    시험 합성 실패({probe_id}): {exc}")
            return None
    return out


def probe_score(durations: list[float], sentences: list[str]) -> float:
    """예상 상한(엔진 폭주 가드와 같은 식)을 넘은 길이의 합. 후보끼리 상대 비교용."""
    return sum(
        max(0.0, d - (PROBE_RAMBLE_BASE_SEC + len(s) * config.RAMBLE_PER_CHAR_SEC))
        for d, s in zip(durations, sentences)
    )


def pick_best(scores: list[float | None]) -> int:
    """점수가 가장 낮은 후보 번호. 같으면 앞 번호, 전부 None 이면 0(지금 규칙의 창)."""
    best = None
    for i, sc in enumerate(scores):
        if sc is not None and (best is None or sc < scores[best]):
            best = i
    return 0 if best is None else best


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


PROBE_CANDIDATES = int(os.environ.get("COSYVOICE_PROMPT_CANDIDATES", "3"))


def _clear_probe(root: str, prefix: str) -> None:
    """시험 견본 폴더와 엔진 prompt_cache 의 시험 파일을 지운다."""
    import glob
    import shutil

    for d in glob.glob(os.path.join(root, prefix + "*")):
        shutil.rmtree(d, ignore_errors=True)
    for f in glob.glob(os.path.join(config.PROMPT_CACHE_DIR, prefix + "*_prompt.wav")):
        try:
            os.unlink(f)
        except OSError:
            pass


def _build_with_probe(clone_id: str, ref_root: str | None, src: str,
                      wins: list[tuple[float, float]]) -> bool:
    """후보 창마다 시험 견본을 만들어 짧은 질문을 합성해 보고, 늘어짐이 가장 적은 것을 쓴다.

    시험 합성이 전부 실패하면 전사된 첫 후보(지금 규칙의 창)를 쓴다. 전사가 전부 실패하면
    종전처럼 견본 쌍을 만들지 않는다. 시험 폴더·캐시는 어떤 경우에도 지운다.
    """
    import shutil

    root = ref_root if ref_root is not None else config.REF_ROOT
    prefix = f"zz-probe-{clone_id}-"
    _clear_probe(root, prefix)  # 같은 클론 prebuild 가 남긴 것
    try:
        texts: list[str | None] = []
        durs: list[list[float] | None] = []
        scores: list[float | None] = []
        for i, (ws, we) in enumerate(wins):
            pw, pt = prompt_pair_paths(f"{prefix}{i}", root)
            os.makedirs(os.path.dirname(pw), exist_ok=True)
            text = transcribe(pw) if cut(src, pw, ws, we - ws) else None
            d = None
            if text:
                with open(pt, "w", encoding="utf-8") as f:
                    f.write(text)
                d = probe_durations(f"{prefix}{i}", PROBE_SENTENCES, PROBE_URL)
            texts.append(text)
            durs.append(d)
            scores.append(probe_score(d, PROBE_SENTENCES) if d is not None else None)
        pick = pick_best(scores)
        if not texts[pick]:
            pick = next((i for i, t in enumerate(texts) if t), None)
            if pick is None:
                print(f"[{clone_id}] 후보 전사 전부 실패 — 견본 쌍 안 만듦")
                return False
        wav_dst, txt_dst = prompt_pair_paths(clone_id, ref_root)
        pw, _ = prompt_pair_paths(f"{prefix}{pick}", root)
        shutil.copyfile(pw, wav_dst)
        with open(txt_dst, "w", encoding="utf-8") as f:
            f.write(texts[pick])
        with open(os.path.join(os.path.dirname(wav_dst), "prompt_probe.json"), "w",
                  encoding="utf-8") as f:
            json.dump({"windows": [list(w) for w in wins], "texts": texts, "durations": durs,
                       "scores": scores, "picked": pick, "sentences": PROBE_SENTENCES},
                      f, ensure_ascii=False, indent=1)
        print(f"[{clone_id}] probe scores={scores} pick={pick}  ⟪{texts[pick][:40]}⟫")
        return True
    finally:
        _clear_probe(root, prefix)


def build(clone_id: str, ref_root: str | None = None) -> bool:
    src = ref_audio_path(clone_id, ref_root)
    if not os.path.isfile(src):
        print(f"[{clone_id}] voice.wav 없음 — skip")
        return False

    wav_dst, txt_dst = prompt_pair_paths(clone_id, ref_root)
    start = speech_start(src)
    total = duration(src)
    if os.environ.get("COSYVOICE_PROMPT_PROBE") == "1":
        wins = candidate_windows(src, start, total, PROBE_CANDIDATES)
        if len(wins) >= 2:
            return _build_with_probe(clone_id, ref_root, src, wins)
    end, reason = pick_end(src, start, total)
    if end is None:
        print(f"[{clone_id}] 다듬기 실패({reason}) 발화 {total - start:.1f}s — 견본 쌍 안 만듦")
        return False

    # 원본(voice.raw·voice.wav)은 건드리지 않는다 — qwen3tts·openvoice 가 voice.wav 를
    # 그대로 쓴다. 잘라낸 결과는 새 파일로만 남긴다.
    #
    # wav 를 먼저 제자리에 쓰고 텍스트를 나중에 쓴다. STT(/transcribe_path)가 REF_ROOT
    # 아래 경로만 받기 때문이고, 그 사이의 중간 상태(wav 만 있고 txt 없음)는 ref_pair 가
    # 쌍 미완으로 보고 기존 자산으로 폴백하므로 안전하다(test_클론_ref_pair 로 고정).
    if not cut(src, wav_dst, start, min(end, total) - start):
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
