"""
voice_fetch.py — 통화 시작 시 클론 원본 음성을 받아 qwen3tts용 voice.wav로 변환·배치.

흐름: voiceRawUrl(/oth-path<id>) → asset_fetch.fetch_to → ffmpeg(mono wav) →
{ref_root}/{clone_id}/voice.wav. 이미 있으면 skip. 폴백 없음(실패 시 예외 전파).
"""
import asyncio
import os
import pathlib
import sys
import uuid

from asset_fetch import fetch_to

# 변환 결과가 이 바이트 미만이면 손상/빈 wav로 간주(헤더만=44B). skip 캐시 손상 영속화 방지.
_MIN_WAV_BYTES = 1024

# denoise 기본 필터 체인(보수적 — 음색 보존 우선): 80Hz 저주파 컷 + 약한 FFT denoise.
_DEFAULT_DENOISE_AF = "highpass=f=80,afftdn=nr=10:nf=-25:tn=1"

# 진단용 원본 사본 파일명. 확장자는 원본 포맷(m4a/mp3/wav …)에 따라 달라서 고정하지 않는다.
RAW_NAME = "voice.raw"


def _keep_original(src_tmp: str, raw_dest: str) -> None:
    """변환에 쓴 원본을 voice.raw 로 이동해 보존한다(클론당 1개, 덮어쓰기).

    부가기능이므로 실패는 삼킨다 — 사본 보존이 통화(voice.wav 생성)를 깨면 안 된다.
    os.replace 라 이전 사본은 자동으로 대체되고 누적되지 않는다.
    """
    try:
        os.replace(src_tmp, raw_dest)
    except OSError:
        pass


def _denoise_af_args(env=None) -> list:
    """env 토글에 따라 ffmpeg -af denoise 인자를 반환.

    PRETHIRD_VOICE_DENOISE == "1" 일 때만 활성. 비활성이면 빈 리스트라
    명령이 기존과 동일(회귀 0). PRETHIRD_VOICE_DENOISE_AF 로 필터 문자열 override.
    """
    e = env if env is not None else os.environ
    if e.get("PRETHIRD_VOICE_DENOISE") != "1":
        return []
    af = e.get("PRETHIRD_VOICE_DENOISE_AF") or _DEFAULT_DENOISE_AF
    return ["-af", af]


def _ffmpeg_cmd(src: str, dest: str, env=None) -> list:
    """ffmpeg 변환 명령을 조립한다. denoise 토글 on이면 -af 를 -i 다음에 삽입.

    토글 off(기본)면 denoise args가 빈 리스트라 기존 명령과 동일(회귀 0).
    """
    return [
        "ffmpeg", "-y", "-i", src,
        *_denoise_af_args(env),
        "-ac", "1", "-f", "wav", dest,
    ]


async def _ffmpeg_to_wav(src: str, dest: str) -> str:
    """src(임의 오디오 포맷) → mono wav(dest). soundfile 호환용. sr은 원본 보존.

    -f wav 명시: dest가 voice.{uid}.wav.part(.part 확장자)라 ffmpeg가 출력 포맷을
    확장자로 추론하지 못해 muxer 초기화 실패(Invalid argument). 포맷 강제로 .part도 wav.

    PRETHIRD_VOICE_DENOISE 토글 시 -af denoise 체인 삽입(_ffmpeg_cmd). denoise 변환이
    실패(가비아 필터 부재·override 오타로 rc≠0)하면 denoise 없이 1회 폴백 —
    부가기능(denoise) 실패가 통화(voice.wav 생성)를 깨지 않도록.
    """
    async def _run(cmd):
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        return proc.returncode, stderr

    rc, stderr = await _run(_ffmpeg_cmd(src, dest))
    if rc != 0 and _denoise_af_args():
        # denoise가 켜져 있었고 변환 실패 → denoise 없이 폴백(통화 유지).
        sys.stderr.write(
            f"[voice_fetch] denoise 변환 실패(rc={rc}) → denoise 없이 폴백: "
            f"{stderr.decode('utf-8', 'replace')[-300:]}\n"
        )
        sys.stderr.flush()
        rc, stderr = await _run(_ffmpeg_cmd(src, dest, env={}))
    if rc != 0:
        raise RuntimeError(
            f"ffmpeg 변환 실패 (rc={rc}): {stderr.decode('utf-8', 'replace')[-500:]}"
        )
    return dest


async def ensure_voice_wav(
    clone_id,
    voice_raw_url: str,
    ref_root: str,
    *,
    _fetch=fetch_to,
    _convert=_ffmpeg_to_wav,
) -> str:
    """
    {ref_root}/{clone_id}/voice.wav 를 보장한다. 이미 있으면 그대로 반환.
    없으면 voice_raw_url에서 원본을 받아 ffmpeg로 wav 변환 후 원자적 배치.
    실패 시 예외 전파(폴백 없음). 임시파일은 항상 정리.

    동시통화 안전: uuid 유니크 임시파일 + os.replace(원자적). asset_fetch.fetch_to의
    'dest 존재 시 skip'과 충돌하지 않도록 src_tmp는 매 호출 새 경로.

    변환 성공 시 원본을 voice.raw 로 남긴다(클론당 1개, 덮어쓰기). 원본은 API 에도
    있지만 조회에 사용자 access_token 이 필요해 서버 쪽 진단에서는 닿지 않는다 —
    ref 오염(클론 9104)이 업로드 단계인지 변환 단계인지 가르려면 사본이 필요하다.
    """
    clone_dir = os.path.join(ref_root, str(clone_id))
    dest = os.path.join(clone_dir, "voice.wav")
    if os.path.isfile(dest):
        return dest

    pathlib.Path(clone_dir).mkdir(parents=True, exist_ok=True)
    uid = uuid.uuid4().hex
    src_tmp = os.path.join(clone_dir, f"voice.{uid}.src")
    wav_tmp = os.path.join(clone_dir, f"voice.{uid}.wav.part")
    try:
        await _fetch(voice_raw_url, src_tmp)
        await _convert(src_tmp, wav_tmp)
        if not os.path.isfile(wav_tmp) or os.path.getsize(wav_tmp) < _MIN_WAV_BYTES:
            sz = os.path.getsize(wav_tmp) if os.path.isfile(wav_tmp) else -1
            raise RuntimeError(
                f"변환 결과 wav가 비었거나 너무 작음({sz}B) — skip 캐시 손상 방지 (clone={clone_id})"
            )
        os.replace(wav_tmp, dest)  # 원자적 — 동시통화도 안전
        _keep_original(src_tmp, os.path.join(clone_dir, RAW_NAME))
    finally:
        for p in (src_tmp, wav_tmp):
            try:
                os.remove(p)
            except OSError:
                pass
    return dest
