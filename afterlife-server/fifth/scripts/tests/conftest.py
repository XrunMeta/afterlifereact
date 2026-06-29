"""pytest conftest — 로컬 venv(cv2/omegaconf 미설치) 테스트 환경 공통 설정.

render_offline.py 는 최상위 `import cv2` / flp_engine 은 `from omegaconf import OmegaConf` 를
포함하므로, 없는 환경에서 make_blink_sequence 등을 임포트하려면 sys.modules 에 stub 을 주입해야 한다.
이 conftest 가 세션 시작 시 stub 을 등록해 모든 테스트 파일에서 자동 적용된다.
"""
import sys
import types

# cv2 stub — render_offline.py 최상위 임포트 우회
if "cv2" not in sys.modules:
    _fake_cv2 = types.ModuleType("cv2")
    _fake_cv2.IMWRITE_JPEG_QUALITY = 1
    _fake_cv2.imencode = lambda ext, img, params=None: (True, img.tobytes())
    _fake_cv2.imread = lambda path, flags=None: None
    _fake_cv2.cvtColor = lambda img, code: img
    _fake_cv2.COLOR_RGB2BGR = 4
    sys.modules["cv2"] = _fake_cv2

# omegaconf stub — flp_engine.py 최상위 임포트 우회
if "omegaconf" not in sys.modules:
    _fake_oc = types.ModuleType("omegaconf")
    _fake_oc.OmegaConf = object  # make_blink_sequence 는 OmegaConf 미사용
    sys.modules["omegaconf"] = _fake_oc
