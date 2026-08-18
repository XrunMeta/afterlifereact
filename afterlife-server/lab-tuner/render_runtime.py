"""렌더서버 기동·렌더 로그에서 **실제로 적용된 값**을 뽑아낸다.

왜 로그인가
-----------
렌더서버 `/config` 는 믿을 수 없다. 스스로 "infer_params 는 코드 강제·env
오버라이드까지 반영된 최종값"이라 주장하면서 `cfg_scale` 을 **env 가 2.0 일 때도
2.5 일 때도 항상 1.2** 로 보여준다(2026-08-18 실측). `driving_multiplier` 는 맞게
보여줘서 더 헷갈린다 — 일부만 맞는 계기판이 아예 없는 것보다 나쁘다.

렌더서버가 스스로 찍는 로그는 그 순간 실제로 쓴 값이다. 정본은 이쪽이다.

읽는 줄 네 가지
---------------
    INFO FifthConfig: FifthConfig(fps=25, lip_open=0.24, ...)     기동 시 기본값
    [flp_engine] flag_relative_motion=False  cfg_scale=2.0  ...   FLP 엔진 실제값
    INFO JoyVASA 로드 완료 (cfg_scale=2.0)                        JoyVASA 실제값
    INFO [cfg-final] lip_open=0.24 ... (override=없음)            매 렌더 최종값
    INFO [lip-path] 오디오 기반 계산 (lip_open=0.24 사용)          잠금 우선순위 결과

🔴 로그에는 재기동 이력이 쌓인다. **가장 최근 기동 이후**만 봐야 한다 — 옛 기동값을
보여주면 "재기동했는데 안 바뀌었다"고 정반대로 판단하게 된다.
"""
from __future__ import annotations

import re

# 기동 마커. 이 줄이 나올 때마다 새 프로세스가 뜬 것이다.
_BOOT = re.compile(r"^(\w{3}\s+\d+\s+[\d:]+).*FifthConfig:\s*FifthConfig\((.*?)\)\s*$")
_FLP = re.compile(r"^(\w{3}\s+\d+\s+[\d:]+).*\[flp_engine\]\s+(\S+=\S+(?:\s+\S+=\S+)*)\s*$")
_JOYVASA = re.compile(r"^(\w{3}\s+\d+\s+[\d:]+).*JoyVASA 로드 완료 \((.*?)\)\s*$")
# 🔴 요약 줄(_FLP)은 cfg 가 아니라 **오버라이드 이전 지역변수**를 찍는다(컨테이너 코드 실측
# 2026-08-18: `flag_eye_retargeting={_blink_enabled}`). 실제 적용은 apply_flp_env_overrides
# 의 setattr 이고 이 줄이 그 증거다 — 요약 줄만 읽으면 "env 를 넣었는데 안 먹었다"고
# 정반대로 판단하게 된다. animation_region 은 요약 줄에 아예 안 찍혀 이쪽이 유일한 근거다.
_FLP_OVERRIDE = re.compile(
    r"^(\w{3}\s+\d+\s+[\d:]+).*\[flp_engine\] FLP env 오버라이드:\s*(.*?)\s*$")
_CFG_FINAL = re.compile(
    r"^(\w{3}\s+\d+\s+[\d:]+).*\[cfg-final\]\s+(.*?)\s*\(override=(.*?)\)\s*$")
_LIP_PATH = re.compile(r"^(\w{3}\s+\d+\s+[\d:]+).*\[lip-path\]\s+(.*?)\s*$")

# ExecStart env → 로그에서 대응되는 값의 위치. 여기 없는 env 는 대조하지 않는다
# (로그에 근거가 없는데 "불일치"라 부르면 거짓 경보가 된다).
ENV_TO_LOG = {
    "FIFTH_CFG_SCALE": ("flp_engine", "cfg_scale"),
    "FIFTH_DRIVING_MULTIPLIER": ("flp_engine", "driving_multiplier"),
    "FIFTH_LIP_OPEN": ("fifth_config", "lip_open"),
}


def _kv(text: str, sep: str = None) -> dict:
    """'a=1  b=2' 또는 'a=1, b=2' → {'a':'1','b':'2'}. 값은 문자열로 보존한다.

    bool·경로가 섞여 있어 숫자 캐스팅은 위험하다 — 표시가 목적이다.
    """
    out = {}
    for token in (text.split(sep) if sep else text.split()):
        token = token.strip().rstrip(",")
        if "=" not in token:
            continue
        k, v = token.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def parse(log_text: str) -> dict:
    """journalctl 본문 → 실제 적용값 스냅샷.

    없는 값은 빈 dict/None 으로 남긴다. 모르면 모른다고 하는 편이 낫다 —
    /config 가 아는 척하다 틀렸던 자리를 대신하는 계기판이기 때문이다.
    """
    lines = (log_text or "").splitlines()

    # 마지막 기동 지점을 먼저 찾는다. 그 이후 줄만 기동값으로 인정한다.
    boot_idx, booted_at, fifth_config = -1, None, {}
    for i, line in enumerate(lines):
        m = _BOOT.match(line)
        if m:
            boot_idx, booted_at = i, m.group(1)
            fifth_config = _kv(m.group(2), sep=",")

    after_boot = lines[boot_idx + 1:] if boot_idx >= 0 else []

    flp_engine, joyvasa, flp_override = {}, {}, {}
    for line in after_boot:
        m = _FLP_OVERRIDE.match(line)
        if m:
            flp_override = _kv(m.group(2), sep=",")
            continue
        m = _FLP.match(line)
        if m:
            flp_engine = _kv(m.group(2))
            continue
        m = _JOYVASA.match(line)
        if m:
            joyvasa = _kv(m.group(2), sep=",")
    # env 오버라이드가 최종 승자다 — 요약 줄 위에 덮는다.
    flp_engine.update(flp_override)

    # cfg-final·lip-path 는 렌더마다 찍힌다 — 기동 여부와 무관하게 **가장 마지막** 것.
    # 기동 로그가 잘려 나가고 렌더 로그만 남는 상황이 흔하다.
    cfg_final, lip_path = None, None
    for line in lines:
        m = _CFG_FINAL.match(line)
        if m:
            cfg_final = {"at": m.group(1), "values": _kv(m.group(2)),
                         "override": m.group(3)}
            continue
        m = _LIP_PATH.match(line)
        if m:
            lip_path = m.group(2)

    return {
        "booted_at": booted_at,
        "fifth_config": fifth_config,
        "flp_engine": flp_engine,
        "flp_override": flp_override,   # env 로 덮은 항목(UI 가 출처를 표시한다)
        "joyvasa": joyvasa,
        "cfg_final": cfg_final,
        "lip_path": lip_path,
    }


def mismatches(snapshot: dict, env: dict) -> list:
    """ExecStart env 와 로그 실제값이 어긋난 항목.

    env 를 넣고 재기동했는데 엔진이 다른 값으로 떴다면 그것이 진짜 문제다
    (yaml 이 덮었거나 env 이름이 틀렸거나). /config 가 거짓말하던 자리를
    이 대조가 대신한다.
    """
    out = []
    for name, want in (env or {}).items():
        loc = ENV_TO_LOG.get(name)
        if loc is None:
            continue
        got = (snapshot.get(loc[0]) or {}).get(loc[1])
        if got is None:
            continue
        if str(got) != str(want):
            out.append({"env": name, "expected": str(want), "actual": str(got)})
    return out
