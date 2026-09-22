"""랩이 보내는 per-request 키 ↔ 컨테이너 렌더서버가 실제로 읽는 키 대조.

이 테스트가 존재하는 이유:
랩은 prethird/컨테이너 코드를 in-process 로 쓰기 때문에 상대가 시그니처를 바꾸면
조용히 깨진다(전례 2건 — `min_len` 제거 미추종으로 /offer 500). 그때 관대한 모킹
(`FakePipeline(**kw)`)이 드리프트를 삼켜 182개 테스트가 전부 통과했다.

따라서 여기서는 **모킹을 쓰지 않고 실제 소스를 AST 로 파싱**해 대조한다.
컨테이너 소스를 import 하지 않는 이유는 랩 테스트 환경에 GPU 의존성이 없어서다.
"""
import ast
import pathlib

from knobs import FifthKnobs

_SERVER = (pathlib.Path(__file__).resolve().parents[2]
           / "fifth" / "scripts" / "fifth_render_server.py")


def _server_accepted_keys() -> set[str]:
    """렌더서버가 요청 body 에서 읽는 키를 수집.

    두 경로를 본다.
      1. req.get("...") — render_opts 계열
      2. _CFG_KEYS 딕셔너리 리터럴 — FifthConfig 오버라이드 계열
    """
    tree = ast.parse(_SERVER.read_text(encoding="utf-8"))
    keys: set[str] = set()
    for node in ast.walk(tree):
        if (isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and node.func.attr == "get"
                and node.args
                and isinstance(node.args[0], ast.Constant)
                and isinstance(node.args[0].value, str)):
            keys.add(node.args[0].value)
        if isinstance(node, ast.Assign) and any(
                getattr(t, "id", None) == "_CFG_KEYS" for t in node.targets):
            if isinstance(node.value, ast.Dict):
                for k in node.value.keys:
                    if isinstance(k, ast.Constant) and isinstance(k.value, str):
                        keys.add(k.value)
    return keys


def test_렌더서버_사본이_존재한다():
    """경로가 바뀌면 아래 대조가 조용히 무력화되므로 별도로 못 박는다."""
    assert _SERVER.exists(), f"렌더서버 사본 없음: {_SERVER}"


def test_수집이_실제로_동작한다():
    """AST 파싱이 빈 집합을 반환하면 대조가 통과해 버린다 — 자체 검증."""
    keys = _server_accepted_keys()
    assert "wav_path" in keys and "video_path" in keys
    assert len(keys) > 20


def test_랩이_보내는_모든_키를_서버가_읽는다():
    unknown = set(FifthKnobs.PER_REQUEST) - _server_accepted_keys()
    assert unknown == set(), (
        f"서버가 안 읽는 키를 랩이 보냄: {sorted(unknown)} — "
        "컨테이너 렌더서버 배포 누락이거나 이름 오타"
    )


def _fifth_config_fields() -> set[str]:
    """fifth/scripts/config.py 의 FifthConfig 필드명을 AST 로 읽는다.

    import 하지 않는 이유: prethird 에도 동명 config.py 가 있고 sys.path 에서
    그쪽이 먼저 잡힌다(랩은 prethird 를 in-process 로 쓴다). 경로를 명시해
    파일을 직접 파싱해야 올바른 모듈을 본다.
    """
    src = (_SERVER.parent / "config.py").read_text(encoding="utf-8")
    tree = ast.parse(src)
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == "FifthConfig":
            return {
                n.target.id for n in node.body
                if isinstance(n, ast.AnnAssign) and isinstance(n.target, ast.Name)
            }
    return set()


def test_입싱크_키가_전부_랩에_노출된다():
    """FifthConfig 필드는 전부 per-request 노브로 조절 가능해야 한다."""
    cfg_fields = _fifth_config_fields()
    assert cfg_fields, "FifthConfig 필드 파싱 실패"
    missing = cfg_fields - set(FifthKnobs.PER_REQUEST)
    assert missing == set(), f"랩에 없는 cfg 필드: {sorted(missing)}"
