import os
import re
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
    """토큰은 메모리에만 — localStorage 에 닿으면 안 된다.

    2026-08-15 이전에는 localStorage.setItem/getItem 자체를 금지했지만, 노브 값을
    브라우저에 저장하는 기능이 들어오면서 그 금지가 성립하지 않는다. 지키려던 것은
    "토큰이 디스크에 남지 않는다" 이므로 그 계약만 직접 검사한다.
    """
    with open(os.path.join(_STATIC, "tuner.js")) as f:
        js = f.read()

    # 1. 저장 키는 노브 전용 하나뿐이어야 한다.
    keys = set(re.findall(r"localStorage\.\w+\(([A-Za-z_$][\w$]*)", js))
    assert keys == {"KNOB_STORE_KEY"}, f"예상 못한 localStorage 키: {keys}"

    # 2. 저장 대상 순회는 KNOB_INPUT_SELECTOR 뿐이고, 그 셀렉터에 토큰 입력칸이
    #    섞여 있으면 안 된다(섞이는 순간 토큰이 저장된다).
    sel = re.search(r"const KNOB_INPUT_SELECTOR\s*=\s*(.+?);", js, re.S)
    assert sel, "KNOB_INPUT_SELECTOR 를 못 찾음"
    for tok_id in ("promote-token", "source-token"):
        assert tok_id not in sel.group(1)

    # 3. 실행되는 줄에서 토큰과 localStorage 가 만나면 안 된다(주석은 설명이라 제외).
    for line in js.splitlines():
        code = line.split("//")[0]
        if "localStorage" not in code:
            continue
        assert "token" not in code.lower(), line


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


def test_스텝은_범위와_정밀도를_반영한다():
    """0.05 단위 고정이면 lip_closed(0.0023) 같은 미세값을 조절할 수 없다."""
    js = _read("tuner.js")
    assert "function stepFor" in js
    assert "0.001" in js and "0.1" in js
    # 범위를 벗어나지 않게 클램프해야 한다.
    assert "Math.max(m.min" in js and "Math.min(m.max" in js
    # 부동소수 누적 오차 방지
    assert "toFixed(dec)" in js


def test_압축_레이아웃_토글():
    """노브 60종이라 기본은 압축, 필요할 때 설명을 펼친다."""
    html, js = _read("tuner.html"), _read("tuner.js")
    assert 'body class="compact"' in html
    assert "body.compact" in html
    assert 'id="toggle-compact"' in html
    assert "classList.toggle('compact')" in js
    assert "knob-list" in js and ".knob-list" in html


def test_runs는_스크롤_역순():
    """run 이 쌓이면 목록이 화면을 다 먹는다 — 300px 스크롤 + 최근 것이 위."""
    html, js = _read("tuner.html"), _read("tuner.js")
    assert "#runs-list{max-height:300px" in html.replace(" ", "")
    assert "overflow-y:auto" in html
    assert "runs.reverse()" in js


def test_고정바에_재기동과_잠금토글():
    html, js = _read("tuner.html"), _read("tuner.js")
    assert 'id="restart-top"' in html
    assert 'id="toggle-locks"' in html
    assert "LOCK_SWITCHES" in js


def test_재기동_필요값_변경시_버튼_강조():
    """적용만 눌러선 안 먹는 값을 바꿨을 때 재기동 버튼이 눈에 띄어야 한다."""
    html, js = _read("tuner.html"), _read("tuner.js")
    assert "markRestartDirty" in js and "clearRestartDirty" in js
    assert "needs-attention" in js
    assert "button.needs-attention" in html
    # 스텝퍼는 change 이벤트가 안 나므로 bump 에서도 알려야 한다
    bump = js[js.index("const bump ="):js.index("const bump =") + 700]
    assert "markRestartDirty" in bump


# ---------------------------------------------------------------------------
# 업로드 소스 UI — 얼굴(영상·사진) / 목소리(음성)
# ---------------------------------------------------------------------------

def test_렌더소스_패널이_사진도_된다고_알린다():
    """확장자 목록만 보고는 사진이 되는지 알 수 없다 — 문장으로 말해 준다.

    accept 속성에는 처음부터 이미지가 들어 있었는데 안내 문구가 '얼굴 업로드' 뿐이라
    영상만 되는 줄 알고 쓰는 사람이 있었다(히즈키 2026-08-18).
    """
    html = _read("tuner.html")
    panel = html[html.index('id="source-panel"'):html.index('id="source-list"')]
    assert "사진" in panel and "영상" in panel
    # 둘의 동작 차이(정지 영상 생성 여부)도 알려야 고르는 기준이 생긴다.
    assert "정지 영상" in panel


def test_음성_패널_요소가_html에_있다():
    html = _read("tuner.html")
    for el_id in ("voice-panel", "voice-file", "voice-upload-btn",
                  "voice-upload-status", "voice-ref-text", "voice-list", "voice-root"):
        assert f'id="{el_id}"' in html, f"HTML 에 #{el_id} 없음"


def test_음성_패널이_얼굴과_독립임을_알린다():
    html = _read("tuner.html")
    panel = html[html.index('id="voice-panel"'):html.index('id="voice-list"')]
    assert "얼굴" in panel and "목소리" in panel


def test_음성_file_input이_오디오만_받는다():
    html = _read("tuner.html")
    panel = html[html.index('id="voice-file"'):]
    accept = panel[panel.index("accept="):panel.index(">")]
    assert ".wav" in accept and ".mp3" in accept
    assert ".mp4" not in accept and ".jpg" not in accept


def test_js_음성_엔드포인트를_부른다():
    js = _read("tuner.js")
    for needle in ("/voices", "/voice/upload", "/voice/delete"):
        assert needle in js, needle


def test_js_음성_선택은_voice_source_노브로_저장한다():
    js = _read("tuner.js")
    assert "voice_source" in js
    assert "k_source_voice_source" in js


def test_js_음성_선택도_브라우저_저장에서_복원한다():
    """render_source 와 같은 이유 — 빈 값(클론 기본)은 applyKnobs 가 건너뛴다."""
    js = _read("tuner.js")
    assert "'source.voice_source' in vals" in js


def test_js_프롬프트쌍_없는_업로드를_경고한다():
    """짧은 프롬프트 쌍이 없으면 짧은 발화에서 폭주한다(2026-08-13 실측).

    올린 사람이 그 위험을 모르면 '가끔 이상해요' 로만 보고된다.
    """
    js = _read("tuner.js")
    assert "prompt_pair" in js


def test_js_음성_삭제도_2단계_확인():
    js = _read("tuner.js")
    block = js[js.index("function _voiceCard"):js.index("async function loadVoices")]
    assert "정말?" in block


# ---------------------------------------------------------------------------
# 2026-08-18: container 노브가 "먹는 것처럼" 보이던 문제
#
# fifth/flp env 노브는 prethird 재기동으로는 절대 반영되지 않는데, UI 가 그 버튼을
# 강조해 잘못된 행동을 유도했다("적용도 하고 재기동도 했는데 무시된다" — 히즈키).
# ---------------------------------------------------------------------------

def test_container_노브는_prethird_재기동을_강조하지_않는다():
    """조건문이 윗줄에 있어 줄 단위 검사로는 못 잡는다 — 조건 블록을 통째로 본다."""
    js = _read("tuner.js")
    block = js[js.index("function buildKnobRow"):js.index("function stepFor")]
    for m in re.finditer(r"if \(([^)]*'container'[^)]*)\)([^;]{0,200})", block):
        assert "markRestartDirty" not in m.group(2), m.group(0)


def test_container_노브는_렌더서버_재기동을_강조한다():
    js = _read("tuner.js")
    assert "markRenderDirty" in js
    block = js[js.index("function buildKnobRow"):js.index("function stepFor")]
    assert "markRenderDirty" in block


def test_container_는_재연결_계열과_구분표시된다():
    """압축 모드에선 배지가 숨겨진다 — 기호까지 같으면 구분이 사라진다.

    session(끊고 다시 걸면 됨)과 container(렌더서버 재기동 필요)는 사용자가 해야 할
    행동이 전혀 다르다.
    """
    js, html = _read("tuner.js"), _read("tuner.html")
    assert "needs-container" in js
    assert "body.compact .knob-row.needs-container" in html.replace("\n", " ")


def test_container_배지_문구가_렌더서버를_지목한다():
    js = _read("tuner.js")
    note = js[js.index("const REFLOW_NOTE"):js.index("};", js.index("const REFLOW_NOTE"))]
    assert "렌더서버" in note


def test_렌더서버_재기동_버튼과_배선():
    html, js = _read("tuner.html"), _read("tuner.js")
    assert 'id="restart-render"' in html
    assert "/promote/render-restart" in js
    assert "/promote/render-preview" in js
    # app.py render_restart 계약: confirm:"RESTART_RENDER" + confirm2:true 둘 다.
    assert "'RESTART_RENDER'" in js or '"RESTART_RENDER"' in js
    assert "confirm2" in js
    # 브라우저 모달 금지 원칙(인라인 확인 UI).
    assert "render-restart-confirm" in js


def test_렌더서버_재기동은_라이브_끊김을_경고한다():
    """fifth 컨테이너는 라이브와 공유한다 — 누르기 전에 알아야 한다."""
    js = _read("tuner.js")
    block = js[js.index("async function renderRestartShowConfirm"):]
    assert "라이브" in block


def test_렌더재기동_409_를_정직하게_표기():
    js = _read("tuner.js")
    block = js[js.index("async function renderRestartApply"):]
    assert "409" in block


# ---------------------------------------------------------------------------
# 2026-08-18: FLP 패널이 /config(거짓말하는 소스)를 쓰던 문제
#
# /config 는 "env 오버라이드까지 반영된 최종값"이라 주장하면서 cfg_scale 을 env 가
# 2.0 이든 2.5 든 항상 1.2 로 보여줬다. 확인 수단이 거짓이라 "적용됐는지 확인이
# 안 된다"(히즈키)로 이어졌다. 정본은 렌더서버가 스스로 찍는 로그다.
# ---------------------------------------------------------------------------

def test_실제적용값_패널이_로그_엔드포인트를_읽는다():
    js = _read("tuner.js")
    assert "/render-runtime" in js


def test_실제적용값_컨테이너가_html에_있다():
    html = _read("tuner.html")
    for el_id in ("render-runtime", "flp-readonly"):
        assert f'id="{el_id}"' in html, el_id


def test_yaml_원본은_참고용으로_낮춰_표기한다():
    """같은 화면에 두 값이 나오면 어느 쪽이 진짜인지 말해줘야 한다."""
    js = _read("tuner.js")
    block = js[js.index("async function loadFlpConfig"):]
    assert "참고" in block or "원본" in block


def test_env와_실제값_불일치를_경고한다():
    """env 를 넣고 재기동했는데 엔진이 다른 값으로 떴다면 그게 진짜 문제다."""
    js = _read("tuner.js")
    assert "mismatches" in js


def test_잠금경로와_최종값을_보여준다():
    """lip-path 는 '잠금을 켰는데 왜 움직이나'를 가리는 유일한 증거다."""
    js = _read("tuner.js")
    block = js[js.index("async function loadRenderRuntime"):]
    assert "lip_path" in block
    assert "cfg_final" in block


def test_기동시각을_보여준다():
    """언제 뜬 값인지 모르면 재기동 반영 여부를 판단할 수 없다."""
    js = _read("tuner.js")
    assert "booted_at" in js


# ---------------------------------------------------------------------------
# 2026-08-18: "적용" 버튼이 통째로 죽어 있던 버그
#
# applyKnobs(only) 를 핸들러로 **직접** 넘기면 첫 인자에 MouseEvent 가 들어간다.
# 그러면 `only.has(...)` 가 TypeError 를 던지고, 그 예외가 _setApplyStatus 보다
# 먼저 나서 화면에는 아무 메시지도 안 뜨고 POST 도 나가지 않는다.
# 브라우저 실측: 클릭 → POST /oth-path 0회 · 상태 텍스트 빈 문자열 ·
#                applyKnobs(new MouseEvent('click')) → "TypeError: only.has is not a function"
#                applyKnobs()                        → POST 1회 · "50개 적용됨"
# 사용자에게는 "값을 바꿔도 전부 무시된다"로 보였다(히즈키 보고).
# ---------------------------------------------------------------------------

def test_applyKnobs를_핸들러로_직접_바인딩하지_않는다():
    """이벤트 객체가 only 인자로 새어 들어가는 것을 원천 차단한다."""
    js = _read("tuner.js")
    bad = re.findall(r"\.onclick\s*=\s*applyKnobs\s*;", js)
    bad += re.findall(r"addEventListener\(\s*['\"]click['\"]\s*,\s*applyKnobs\s*\)", js)
    assert bad == [], f"applyKnobs 직접 바인딩: {bad}"


def test_applyKnobs가_Set이_아닌_인자를_무시한다():
    """배선을 고쳐도 다음 사람이 다시 직접 넘길 수 있다 — 함수 안에서도 막는다."""
    js = _read("tuner.js")
    body = js[js.index("async function applyKnobs"):js.index("async function applyKnobs") + 700]
    assert "instanceof Set" in body, "Set 가드가 없다 — 이벤트 객체가 필터로 오해된다"


def test_적용_버튼이_여전히_배선돼_있다():
    """가드를 넣다가 배선 자체를 잃으면 버튼이 다시 죽는다."""
    js = _read("tuner.js")
    assert "apply-knobs" in js and "apply-knobs-top" in js
    assert "applyKnobs()" in js
