import os
_HERE = os.path.dirname(__file__)
_STATIC = os.path.join(_HERE, "..", "static")


def test_html_has_required_elements():
    with open(os.path.join(_STATIC, "tuner.html")) as f:
        html = f.read()
    for needle in ['id="clone-video"', 'id="say-input"', 'id="knobs-panel"',
                   'id="metrics"', 'tuner.js']:
        assert needle in html, needle


def test_js_calls_endpoints():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    for needle in ["/offer", "/knobs", "/metrics", "RTCPeerConnection"]:
        assert needle in js, needle


def test_html_has_live_status_banner():
    with open(os.path.join(_STATIC, "tuner.html")) as f:
        html = f.read()
    assert 'id="live-banner"' in html


def test_js_polls_live_status_every_3s():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    assert "/live-status" in js
    assert "3000" in js   # 3초 주기


def test_js_has_replay_endpoints():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    assert "/replay/tts" in js
    assert "/replay/fifth" in js


def test_html_has_runs_list_container():
    with open(os.path.join(_STATIC, "tuner.html")) as f:
        html = f.read()
    assert 'id="runs"' in html


def test_js_has_dialogue_restart_note():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # el S6 RISK: system_override/min_len/force_flush는 다음 접속부터 반영됨을 UI에 명시.
    assert "다음 접속부터 반영" in js


def test_prod_status_section_present():
    with open(os.path.join(_STATIC, "tuner.html")) as f:
        html = f.read()
    assert 'id="prod-status"' in html
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    assert "/production-status" in js


def test_prod_status_escapes_untrusted_env_values():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # r.running은 /proc/<mainpid>/environ 원문(미검증)이라 innerHTML 삽입 전 반드시 escape(mizu, T-111 XSS 방어).
    assert "escapeHtml" in js
    loadprod = js[js.index("async function loadProdStatus"):]
    for needle in ["escapeHtml(r.env)", "escapeHtml(r.conf)", "escapeHtml(r.running)", "escapeHtml(r.state)"]:
        assert needle in loadprod, needle


def test_tuner_js_renders_typed_controls():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # 메타 fetch 및 타입 분기 존재(회귀 가드) — bool/enum은 select, D5(현재값 미리 선택)
    assert "/knobs/meta" in js
    assert "createElement('select')" in js or 'createElement("select")' in js
    assert "reflow" in js


# ---------------------------------------------------------------------------
# clone+login UI
# ---------------------------------------------------------------------------

def test_html_has_login_form_elements():
    with open(os.path.join(_STATIC, "tuner.html")) as f:
        html = f.read()
    for needle in ['id="login-email"', 'id="login-pw"', 'type="password"',
                   'id="login-btn"', 'id="clone-select"', 'id="connect-btn"']:
        assert needle in html, needle


def test_js_login_posts_credentials():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    assert "/login" in js
    assert "/oth-path" in js


def test_js_offer_body_includes_clone_id_and_access_token():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    assert "clone_id" in js
    assert "access_token" in js


def test_js_does_not_use_localstorage_for_token():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # 토큰은 메모리 전역변수에만 — localStorage.setItem/getItem 실사용 금지 권장 준수
    # (설명 주석에서 개념을 언급하는 것은 허용, 실제 API 호출만 금지).
    assert "localStorage.setItem" not in js
    assert "localStorage.getItem" not in js


# ---------------------------------------------------------------------------
# T-114: 믹서 채널 스트립 렌더
# ---------------------------------------------------------------------------

def test_js_renders_number_stepper():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # number 노브에 증감 스텝퍼(±) 배선.
    assert "step-up" in js and "step-down" in js


def test_js_tts_qwen_only_dim():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # tts.engine=openvoice일 때 qwen 전용 필드 dim.
    assert "refreshTtsDim" in js
    assert "TTS_QWEN_ONLY_FIELDS" in js


def test_js_channel_strip_render():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # 섹션별 채널 스트립 클래스.
    assert "channel" in js


def test_js_say_enter_to_send():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # Enter 전송 + 한글 IME 조합중 오전송 방지.
    assert "keydown" in js
    assert "'Enter'" in js or '"Enter"' in js
    assert "isComposing" in js


def test_js_status_meter():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # 죽은 SSE 대신 클라 실상태 미터 렌더.
    assert "renderMeter" in js
    # SSE 구독 계약은 유지.
    assert "EventSource" in js and "/metrics" in js
