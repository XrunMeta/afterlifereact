import os, sys

# 로컬(mac): 저장소 상대경로. 가비아: 동일 상대경로.
_HERE = os.path.dirname(os.path.abspath(__file__))
_PRETHIRD = os.path.normpath(os.path.join(_HERE, "..", "..", "prethird", "scripts"))
if _PRETHIRD not in sys.path:
    sys.path.insert(0, _PRETHIRD)
