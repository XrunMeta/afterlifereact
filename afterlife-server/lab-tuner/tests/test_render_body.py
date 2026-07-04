import os
import sys
sys.path.insert(0, os.path.normpath(os.path.join(
    os.path.dirname(__file__), "..", "..", "fifth", "scripts")))
import fifth_render_server as frs
import json


def test_parse_body_defaults():
    raw = json.dumps({"wav_path": "/w.wav", "video_path": "/v.jpg"}).encode()
    wav, vid, tok, opts = frs._parse_render_body(raw)
    # 키 없음 → per-request 전부 None(=env 기본), blink/quality만 명시 기본
    assert opts["blink"] is True and opts["jpeg_quality"] == 90
    assert opts["idle_motion_scale"] is None
    assert opts["head_slew_frames"] is None


def test_parse_body_render_opts():
    raw = json.dumps({"wav_path": "/w.wav", "video_path": "/v.jpg",
                      "blink": False, "jpeg_quality": 60,
                      "idle_motion_scale": 0.3, "head_slew_frames": 2}).encode()
    wav, vid, tok, opts = frs._parse_render_body(raw)
    assert opts["blink"] is False and opts["jpeg_quality"] == 60
    assert opts["idle_motion_scale"] == 0.3 and opts["head_slew_frames"] == 2
