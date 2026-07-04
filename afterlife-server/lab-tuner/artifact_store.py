from __future__ import annotations
import json
import os


class ArtifactStore:
    """run별 LLM 텍스트·wav·프레임을 디스크에 저장. run_id는 카운터 기반(Date 미사용)."""

    def __init__(self, root: str):
        self.root = root
        os.makedirs(root, exist_ok=True)
        self._counter_path = os.path.join(root, ".counter")

    def _next_id(self) -> str:
        n = 0
        if os.path.exists(self._counter_path):
            with open(self._counter_path) as f:
                n = int(f.read().strip() or "0")
        n += 1
        with open(self._counter_path, "w") as f:
            f.write(str(n))
        return f"run{n:05d}"

    def _dir(self, run_id: str) -> str:
        d = os.path.join(self.root, run_id)
        os.makedirs(d, exist_ok=True)
        return d

    def new_run(self) -> str:
        rid = self._next_id()
        meta = {"run_id": rid, "pinned": False}
        with open(os.path.join(self._dir(rid), "meta.json"), "w") as f:
            json.dump(meta, f)
        return rid

    def save_text(self, run_id, name, text):
        p = os.path.join(self._dir(run_id), name)
        with open(p, "w") as f:
            f.write(text)
        os.chmod(p, 0o600)

    def load_text(self, run_id, name) -> str:
        with open(os.path.join(self._dir(run_id), name)) as f:
            return f.read()

    def save_bytes(self, run_id, name, data):
        p = os.path.join(self._dir(run_id), name)
        with open(p, "wb") as f:
            f.write(data)
        os.chmod(p, 0o600)

    def load_bytes(self, run_id, name) -> bytes:
        with open(os.path.join(self._dir(run_id), name), "rb") as f:
            return f.read()

    def path(self, run_id, name) -> str:
        """run_id/name 아티팩트의 절대경로. replay_fifth 등이 파일 경로 그대로
        필요할 때 사용(save_bytes/save_text로 이미 기록된 파일 기준)."""
        return os.path.abspath(os.path.join(self._dir(run_id), name))

    def _meta_path(self, run_id):
        return os.path.join(self._dir(run_id), "meta.json")

    def pin(self, run_id):
        with open(self._meta_path(run_id)) as f:
            meta = json.load(f)
        meta["pinned"] = True
        with open(self._meta_path(run_id), "w") as f:
            json.dump(meta, f)

    def is_pinned(self, run_id) -> bool:
        with open(self._meta_path(run_id)) as f:
            return json.load(f).get("pinned", False)

    def list_runs(self) -> list:
        out = []
        for name in sorted(os.listdir(self.root)):
            mp = os.path.join(self.root, name, "meta.json")
            if os.path.isfile(mp):
                with open(mp) as f:
                    out.append(json.load(f))
        return out
