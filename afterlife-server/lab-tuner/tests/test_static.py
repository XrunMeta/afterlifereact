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


# ---------------------------------------------------------------------------
# T-114 Task 6: promote 배선 (죽은 버튼 살리기)
# ---------------------------------------------------------------------------

def test_js_promote_wired():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    assert "/promote/preview" in js
    assert "/promote/apply" in js


def test_js_no_browser_modals():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # 브라우저 모달은 확장 세션을 블록 → 금지(인라인 UI 사용).
    assert "alert(" not in js
    assert "confirm(" not in js
    assert "prompt(" not in js


# ---------------------------------------------------------------------------
# T-114 최종리뷰 fix: promote 비-2xx 정직표기 + Enter 성공시만 클리어
# ---------------------------------------------------------------------------

def test_js_promote_apply_handles_non_2xx():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # 401/403 외 비-2xx(예: 400 화이트리스트 위반)도 실패로 정직하게 표기해야 함.
    assert "!r.ok" in js
    # 서버가 절대 안 주는 e.value 폴백(dead code)은 제거되어야 함.
    assert "e.value" not in js


# ---------------------------------------------------------------------------
# T-113 Task3-A: prethird 재기동 버튼 (render_mode 등 next_call 노브 반영)
# ---------------------------------------------------------------------------

def test_html_has_restart_button():
    with open(os.path.join(_STATIC, "tuner.html")) as f:
        html = f.read()
    assert 'id="restart-prethird"' in html


def test_js_restart_wired_with_two_stage_confirm_body():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    assert "/promote/restart" in js
    # app.py promote_restart 계약: confirm:"RESTART" + confirm2:true 둘 다 필요.
    assert '"RESTART"' in js or "'RESTART'" in js
    assert "confirm2" in js
    # 브라우저 모달 금지 원칙은 재기동 확인에도 적용(인라인 UX).
    assert "restart-confirm" in js


def test_js_send_say_returns_boolean_and_gates_clear():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # sendSay가 전송 성공 여부를 boolean으로 반환.
    assert "return true" in js
    assert "return false" in js
    # Enter 클리어는 sendSay() 성공 시에만 수행(dc 미개통 시 입력 유실 방지).
    assert "if (sendSay())" in js
