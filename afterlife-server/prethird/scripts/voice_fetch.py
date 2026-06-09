"""
voice_fetch.py — 통화 시작 시 클론 원본 음성을 받아 qwen3tts용 voice.wav로 변환·배치.

흐름: voiceRawUrl(/oth-path<id>) → asset_fetch.fetch_to → ffmpeg(mono wav) →
{ref_root}/{clone_id}/voice.wav. 이미 있으면 skip. 폴백 없음(실패 시 예외 전파).
"""
import asyncio
import os
import pathlib
import uuid

from asset_fetch import fetch_to

# 변환 결과가 이 바이트 미만이면 손상/빈 wav로 간주(헤더만=44B). skip 캐시 손상 영속화 방지.
_MIN_WAV_BYTES = 1024


async def _ffmpeg_to_wav(src: str, dest: str) -> str:
    """src(임의 오디오 포맷) → mono wav(dest). soundfile 호환용. sr은 원본 보존.

    -f wav 명시: dest가 voice.{uid}.wav.part(.part 확장자)라 ffmpeg가 출력 포맷을
    확장자로 추론하지 못해 muxer 초기화 실패(Invalid argument). 포맷 강제로 .part도 wav.
    """
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg", "-y", "-i", src, "-ac", "1", "-f", "wav", dest,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(
            f"ffmpeg 변환 실패 (rc={proc.returncode}): {stderr.decode('utf-8', 'replace')[-500:]}"
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
    finally:
        for p in (src_tmp, wav_tmp):
            try:
                os.remove(p)
            except OSError:
                pass
    return dest
