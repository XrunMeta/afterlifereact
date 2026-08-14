import os
_HERE = os.path.dirname(__file__)
_STATIC = os.path.join(_HERE, "..", "static")


def test_html_source_has_no_hardcoded_plaintext_password():
    # opus 최종리뷰 Minor: 로그인 비번은 VCS 추적 정적 소스에 하드코딩하지 않는다
    # (serve-time LAB_TUNER_DEV_PASSWORD 주입으로 대체, app.py index 핸들러 참조).
    with open(os.path.join(_STATIC, "tuner.html")) as f:
        html = f.read()
    assert "oth-password" not in html
    assert 'id="login-pw" type="password" placeholder="password" autocomplete="current-password" value=""' in html


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


# ---------------------------------------------------------------------------
# T-113 Task3-C: 노브 옆 실제 running 값 + 선택↔실제 drift 배지(render_mode)
# ---------------------------------------------------------------------------

def test_js_render_mode_has_running_drift_badge_wired():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    assert "KNOB_ENV_MAP" in js
    assert "'fifth.render_mode': 'PRETHIRD_RENDER_MODE'" in js
    assert "applyKnobDriftBadges" in js
    assert "재기동 필요" in js
    # running 캐시가 loadKnobs 재렌더·loadProdStatus 갱신 양쪽에서 반영되는지.
    assert js.count("applyKnobDriftBadges()") >= 2


# ---------------------------------------------------------------------------
# T-113 Task3 sion 게이트 fix1(BLOCKER): restart 후 stale drift 방지(폴링)
# ---------------------------------------------------------------------------

def test_js_restart_polls_for_new_mainpid_before_refresh():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    assert "pollForNewMainPid" in js
    restart_apply_block = js[js.index("async function restartApply"):]
    # 응답 직후 바로 loadProdStatus 하지 말고 폴링(MainPID 변경 확인) 완료 후에만 호출.
    assert "pollForNewMainPid" in restart_apply_block
    assert "await loadProdStatus()" in restart_apply_block


# ---------------------------------------------------------------------------
# T-113 Task3 sion 게이트 fix2(MAJOR): 재기동 전 미적용(promote 안됨) 변경 경고
# ---------------------------------------------------------------------------

def test_js_restart_confirm_warns_unapplied_promote_changes():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    confirm_block = js[js.index("async function restartShowConfirm"):js.index("async function pollForNewMainPid")]
    assert "/promote/preview" in confirm_block
    assert "라이브 적용" in confirm_block


# ---------------------------------------------------------------------------
# T-113: /dev-token 로컬 전용 토큰 자동주입(promote-token 수동입력 제거)
# ---------------------------------------------------------------------------

def test_js_loads_dev_token_and_wires_promote_token_input():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    assert "/dev-token" in js
    assert "loadDevToken()" in js   # 초기화 시퀀스에서 호출됨(loadKnobs 등과 함께)
    dev_token_block = js[js.index("async function loadDevToken"):]
    assert "promote-token" in dev_token_block
    # 소스에 하드코딩된 토큰 값이 없어야 함(env 이름 언급은 UI 안내문구라 허용) —
    # loadDevToken은 서버 /dev-token 응답의 d.token만 읽어 input.value에 세팅한다.
    assert "d.token" in dev_token_block


def test_js_send_say_returns_boolean_and_gates_clear():
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()
    # sendSay가 전송 성공 여부를 boolean으로 반환.
    assert "return true" in js
    assert "return false" in js
    # Enter 클리어는 sendSay() 성공 시에만 수행(dc 미개통 시 입력 유실 방지).
    assert "if (sendSay())" in js


def _read(name):
    import pathlib
    return (pathlib.Path(__file__).parents[1] / "static" / name).read_text(encoding="utf-8")


def test_지연구역_컨테이너가_html에_있다():
    """tuner.js 가 getElementById 로 찾는 id 가 실제 HTML 에 있어야 한다."""
    html = _read("tuner.html")
    for el_id in ("latency-panel", "latency-meter", "latency-fields",
                  "ttff-badge", "flp-readonly", "refresh-flp"):
        assert f'id="{el_id}"' in html, f"HTML 에 #{el_id} 없음"


def test_설명과_단계태그_스타일이_정의돼_있다():
    html = _read("tuner.html")
    for cls in (".knob-desc", ".stage-tag", ".lat-bar", ".ro-val"):
        assert cls in html, f"스타일 미정의: {cls}"


def test_desc는_textContent로만_넣는다():
    """innerHTML 경로로 desc 를 넣으면 XSS 표면이 된다(mizu 규약)."""
    js = _read("tuner.js")
    assert "d.textContent = m.desc" in js
    assert "innerHTML = m.desc" not in js


def test_적용은_지연구역도_수집한다():
    """지연 노브를 #latency-fields 로 옮겼으므로 수집 셀렉터도 넓혀야 한다.

    이게 빠지면 TTS 엔진·문장 길이 같은 값이 '적용' 을 눌러도 조용히 무시된다.
    """
    js = _read("tuner.js")
    assert "#latency-fields input" in js, "적용 수집에 지연 구역이 빠졌다"
    assert "#latency-fields select" in js


def test_적용_결과를_확인하고_표시한다():
    """서버 응답을 받아 실제 반영값으로 화면을 갱신하고 결과를 알려야 한다."""
    js = _read("tuner.js")
    assert "apply-status" in js, "적용 결과 표시 영역이 없다"
    assert "resp.ok" in js or "res.ok" in js, "응답 성공 여부를 안 본다"


def test_적용_상태_영역이_html에_있다():
    assert 'id="apply-status"' in _read("tuner.html")


def test_렌더서버_로그_패널이_있다():
    """파라미터가 실제 렌더까지 갔는지 화면에서 확인할 수 있어야 한다."""
    html, js = _read("tuner.html"), _read("tuner.js")
    assert 'id="render-log"' in html
    assert "/render-logs" in js
    assert "cfg-final" in js, "실제 적용값 줄을 강조하지 않는다"


def test_최상단_고정_적용버튼():
    html = _read("tuner.html")
    assert 'id="apply-knobs-top"' in html
    assert "position:sticky" in html or "position: sticky" in html
    assert 'id="apply-status-top"' in html


def test_로그는_textContent로만_넣는다():
    js = _read("tuner.js")
    assert "row.textContent = `${t} ${ln.msg}`" in js


def test_잠금_무력화_경고가_있다():
    """lip_lock 을 켜면 lip_open 이 무시되는데, 값을 넣어도 안 먹는 이유를 알려야 한다."""
    js, html = _read("tuner.js"), _read("tuner.html")
    assert "LOCK_RULES" in js
    assert "refreshLockWarnings" in js
    assert "kill-badge" in js and ".kill-badge" in html
    # 우선순위 3종이 모두 규칙에 들어 있어야 한다(fifth_render.py 근거).
    for sw in ("source_face_lock", "lip_lock", "eyes_open_lock"):
        assert f"switch: '{sw}'" in js, sw
