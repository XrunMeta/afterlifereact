"""tests/conftest.py — 공통 테스트 가드."""
import pytest


@pytest.fixture(autouse=True)
def _clear_denoise_env(monkeypatch):
    """CI/로컬 env 오염 방어 — denoise 토글을 매 테스트마다 제거해
    os.environ 경로(_ffmpeg_to_wav→_ffmpeg_cmd)에서도 회귀 불변식을 보장한다.
    env를 명시 주입하는 테스트는 _denoise_af_args(env=...)로 우선하므로 영향 없음."""
    monkeypatch.delenv("PRETHIRD_VOICE_DENOISE", raising=False)
    monkeypatch.delenv("PRETHIRD_VOICE_DENOISE_AF", raising=False)
