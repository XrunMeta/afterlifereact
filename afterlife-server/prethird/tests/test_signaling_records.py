# afterlife-server/prethird/tests/test_signaling_records.py
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from signaling import _make_dc_handler
from session import Session


class _FakePipeline:
    def __init__(self):
        self.said = []
    async def say(self, text, turn=None, on_first_audio=None):
        if on_first_audio:
            on_first_audio()
        if turn is not None:
            turn.append_token("응답")
        self.said.append(text)
    async def speak(self, text, turn=None, on_first_audio=None):
        self.said.append(text)


def test_say_message_records_input_and_answer(tmp_path):
    import json as _json
    from recorder import make_recorder
    sess = Session("sess0001")
    sess.pipeline = _FakePipeline()
    sess.offer_time = 1_700_000_000.0
    sess.recorder = make_recorder(9051, sess.session_id, root=str(tmp_path))
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel=None)
        handler(_json.dumps({"type": "say", "text": "여보세요", "seq": 1}))
        loop.run_until_complete(asyncio.sleep(0.05))
    finally:
        asyncio.set_event_loop(None)
        loop.close()
    clone_dir = tmp_path / "9051"
    names = sorted(p.name for p in clone_dir.iterdir())
    assert any(n.endswith("-input.txt") for n in names)
    assert any(n.endswith("-answer.txt") for n in names)
    prefixes = {n.split("-")[0] for n in names}
    assert len(prefixes) == 1
