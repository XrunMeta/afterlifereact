import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from session import Session, SessionManager  # noqa: E402

def test_session_starts_idle():
    s = Session(session_id="abc")
    assert s.session_id == "abc" and s.state == "idle"
    assert s.video_track is not None and s.audio_track is not None

def test_manager_add_get_remove():
    mgr = SessionManager()
    s = mgr.create()
    assert mgr.get(s.session_id) is s
    assert mgr.count() == 1
    mgr.remove(s.session_id)
    assert mgr.count() == 0
    assert mgr.get(s.session_id) is None
