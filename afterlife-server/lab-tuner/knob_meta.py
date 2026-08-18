"""노브 UI 메타 — 라벨·설명·실제 파라미터 이름·기본값·범위·반영 시점.

knobs.py 에서 분리했다(파일이 300줄을 넘어 노브 정의와 UI 메타가 섞여 있었다).
`from knobs import KNOB_META` 는 그대로 동작한다(knobs.py 가 재노출).

각 항목의 키
    type    : bool | enum | number | string
    choices : enum 일 때 선택지(반드시 promote._SAFE_ENV_VAL 문자셋 내)
    label   : UI 라벨(한국어)
    desc    : 설명 — 값의 의미와 올리면/내리면 어떻게 되는지
    param   : **실제 파라미터 이름** — 컨테이너 env(FIFTH_*) / /render body 키 /
              prethird env(PRETHIRD_*). 사용자가 로그·문서와 대조할 수 있게 노출한다.
    default : 기본값(문자열로 표기). "미지정" = 값을 안 보내 하위 기본을 따름.
    min/max : 권장 입력 범위. JPEG 품질(1~100)·각도(±45) 처럼 규격이 있는 값은 실제 한계,
              나머지는 실용 범위다. UI 는 input 의 min/max 속성으로만 쓰고 서버는 강제하지 않는다.
    reflow  : 반영 시점 — 아래 4단계
    group   : "latency" 면 원 섹션에서 빠져 최상단 응답속도 구역으로 모인다
    stage   : 지연 항목이 줄이는 단계(LLM / LLM→TTS / TTS / 렌더 / 송출 / 체감)

reflow 4단계 (2026-08-14 실측으로 재분류)
    immediate   : 적용 즉시 — 같은 통화 중 다음 발화부터. 재연결 불필요.
                  근거: harness._build_body(fifth)·build_say_fn(tts)·build_chat_fn(dialogue)
                  이 매 호출 registry.get() 을 읽는다.
    session     : 다음 접속(재연결)부터. factory(sess) 에서 1회 읽히는 값.
    container   : fifth 컨테이너 재기동 필요(FIFTH_* 는 렌더서버 기동 시 1회 로드).
    lab_restart : promote 후 랩/prethird 프로세스 재기동 필요.
                  🔴 transport.*·filler.* 가 여기 해당한다 — prethird 가 config.py 모듈
                  로드 시 상수로 굳혀 읽어서(config.py:6,26,30 등) 랩 registry 를 보지 않는다.
                  즉 이 노브들은 "적용" 만으로는 통화에 아무 영향이 없다.
"""

KNOB_META: dict[str, dict] = {
    # ---------------- 대화(LLM) ----------------
    "dialogue.model": {
        "type": "string", "choices": None, "reflow": "immediate", "label": "LLM 모델",
        "param": "PRETHIRD_OLLAMA_MODEL", "default": "미지정(서버 기본)",
        "desc": "응답을 생성할 ollama 모델 이름. 큰 모델일수록 답이 좋아지고 첫 토큰이 늦게 나온다",
    },
    "dialogue.temperature": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "temperature",
        "param": "temperature", "default": "미지정(서버 기본)", "min": 0, "max": 2,
        "desc": "응답의 무작위성. 0에 가까우면 매번 비슷하게, 1 이상이면 다양하지만 산만해진다",
    },
    "dialogue.system_override": {
        "type": "string", "choices": None, "reflow": "session", "label": "system override",
        "param": "(랩 전용 · 페르소나 앞에 삽입)", "default": "비움",
        "desc": "클론 페르소나 앞에 끼워 넣을 system 메시지. 비우면 원래 페르소나 그대로. "
                "세션 시작 시 1회 읽히므로 재연결해야 반영된다",
    },
    "dialogue.min_len": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "문장 최소 길이",
        "param": "PRETHIRD_SENTENCE_MIN_LEN", "default": "8 (라이브)", "min": 1, "max": 50,
        "group": "latency", "stage": "LLM→TTS",
        "desc": "두 번째 이후 문장을 몇 글자부터 TTS 로 넘길지. 작으면 반응이 빠르지만 "
                "문장이 잘게 쪼개져 부자연스럽다",
    },
    "dialogue.first_min_len": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "첫 문장 최소 길이",
        "param": "PRETHIRD_SENTENCE_FIRST_MIN_LEN", "default": "미지정 → 문장 최소 길이를 따름",
        "min": 1, "max": 50, "group": "latency", "stage": "LLM→TTS",
        "desc": "첫 문장을 몇 글자부터 TTS 로 넘길지. 작을수록 첫 소리가 빨리 나온다"
                "(첫 소리까지 걸리는 시간에 가장 크게 먹힌다). 라이브는 2",
    },
    "dialogue.force_flush": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "강제 전송 길이",
        "param": "PRETHIRD_SENTENCE_FORCE_FLUSH", "default": "48 (라이브)", "min": 8, "max": 200,
        "group": "latency", "stage": "LLM→TTS",
        "desc": "문장 끝이 안 와도 이 글자 수를 넘으면 TTS 로 강제 전송. 길면 첫 소리가 늦어진다",
    },
    "dialogue.max_response_tokens": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "응답 최대 토큰",
        "param": "num_predict (ollama)", "default": "미지정(서버 기본)", "min": 16, "max": 2048,
        "group": "latency", "stage": "LLM",
        "desc": "LLM 응답 길이 상한. 짧을수록 턴이 빨리 끝나고, 너무 짧으면 말이 끊긴다",
    },

    # ---------------- TTS ----------------
    "tts.engine": {
        "type": "enum", "choices": ["openvoice", "qwen", "cosyvoice"],
        "reflow": "immediate", "label": "TTS 엔진",
        "param": "PRETHIRD_TTS_URL", "default": "cosyvoice (라이브 :8203)",
        "group": "latency", "stage": "TTS",
        "desc": "음성 합성 엔진. cosyvoice(:8203)가 라이브 기본 — RTF 0.43 으로 가장 빠르다. "
                "qwen(:8201)은 RTF 0.74 로 느려 통화 중 영상 멈춤의 원인이었다. openvoice 는 :8200",
    },
    "tts.url": {
        "type": "string", "choices": None, "reflow": "immediate", "label": "TTS URL 직접 지정",
        "param": "PRETHIRD_TTS_URL", "default": "비움(엔진 기본 포트)",
        "desc": "엔진 기본 주소 대신 쓸 TTS 서버 주소. 비우면 엔진에 맞는 기본 포트를 쓴다",
    },
    "tts.speed": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "말하기 속도",
        "param": "speed", "default": "1.0", "min": 0.5, "max": 2.0,
        "group": "latency", "stage": "TTS",
        "desc": "말하는 속도 배율. 1.2면 20% 빠르게 말해 재생 시간이 준다(합성에 걸리는 시간은 그대로)",
    },
    "tts.denoise": {
        "type": "bool", "choices": None, "reflow": "immediate", "label": "잡음 제거",
        "param": "denoise", "default": "꺼짐",
        "desc": "합성된 음성에서 잡음을 한 번 걸러낸다. 켜면 깨끗해지지만 합성이 조금 느려진다",
    },
    "tts.temperature": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "temperature (qwen 전용)",
        "param": "temperature", "default": "미지정(엔진 기본)", "min": 0, "max": 2,
        "desc": "음성 생성의 무작위성. 높이면 억양이 다양해지고 발음이 불안정해진다. qwen 에서만 적용",
    },
    "tts.top_p": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "top_p (qwen 전용)",
        "param": "top_p", "default": "미지정(엔진 기본)", "min": 0, "max": 1,
        "desc": "생성 후보를 누적 확률로 제한. 낮추면 안정적이고 단조로워진다. qwen 에서만 적용",
    },
    "tts.top_k": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "top_k (qwen 전용)",
        "param": "top_k", "default": "미지정(엔진 기본)", "min": 1, "max": 100,
        "desc": "생성 후보 개수 제한. 낮추면 안정적이고 단조로워진다. qwen 에서만 적용",
    },
    "tts.repetition_penalty": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "반복 억제 (qwen 전용)",
        "param": "repetition_penalty", "default": "미지정(엔진 기본)", "min": 0.5, "max": 2.0,
        "desc": "같은 소리를 되풀이하는 것을 억제한다. 올리면 '다오~' 같은 늘어짐이 줄어든다. qwen 에서만 적용",
    },
    "tts.max_new_tokens": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "최대 오디오 토큰 (qwen 전용)",
        "param": "max_new_tokens", "default": "미지정(엔진 기본)", "min": 32, "max": 4096,
        "group": "latency", "stage": "TTS",
        "desc": "한 문장당 생성할 오디오 토큰 상한. 줄이면 합성이 빨라지지만 문장 끝이 잘린다. "
                "생성 상한(토큰×20÷25Hz 초)이 폭주 게이트와 얽혀 있어 함부로 줄이면 말끝이 잘린다",
    },

    # ---------------- TTS: CosyVoice 전용 (라이브 엔진 :8203) ----------------
    # 서버가 요청마다 해석한다(2026-08-14 배선). 미지정이면 서버 config 기본값.
    "tts.cv_sampling_top_k": {
        "type": "number", "choices": None, "reflow": "immediate",
        "label": "샘플링 top_k (cosyvoice)",
        "param": "sampling_top_k / COSYVOICE_SAMPLING_TOP_K", "default": "5", "min": 1, "max": 50,
        "desc": "음성 생성의 후보 폭. 실측 폭주율 — 1:20%, 5:50%, 10:40%, 25:60%. "
                "낮추면 안정적이고 밋밋해지며, 5가 자연성 기준으로 확정된 값이다",
    },
    "tts.cv_sampling_top_p": {
        "type": "number", "choices": None, "reflow": "immediate",
        "label": "샘플링 top_p (cosyvoice)",
        "param": "sampling_top_p / COSYVOICE_SAMPLING_TOP_P", "default": "0.8", "min": 0.1, "max": 1.0,
        "desc": "누적 확률로 후보를 자른다. 낮추면 발음이 안정되고 억양이 단조로워진다",
    },
    "tts.cv_ramble_base_sec": {
        "type": "number", "choices": None, "reflow": "immediate",
        "label": "폭주 판정 기본(초) (cosyvoice)",
        "param": "ramble_base_sec / COSYVOICE_RAMBLE_BASE_SEC", "default": "1.8", "min": 0.5, "max": 10,
        "desc": "합성 길이가 '기본 + 글자수×글자당' 을 넘으면 폭주로 보고 재합성한다. "
                "이 값은 문장 길이와 무관한 고정 오버헤드",
    },
    "tts.cv_ramble_per_char_sec": {
        "type": "number", "choices": None, "reflow": "immediate",
        "label": "폭주 판정 글자당(초) (cosyvoice)",
        "param": "ramble_per_char_sec / COSYVOICE_RAMBLE_PER_CHAR_SEC", "default": "0.28",
        "min": 0.05, "max": 1.0,
        "desc": "글자 수에 비례하는 허용 길이. 올리면 관대해져 재합성이 줄고 폭주가 새어나온다",
    },
    "tts.cv_ramble_retries": {
        "type": "number", "choices": None, "reflow": "immediate",
        "label": "폭주 재합성 횟수 (cosyvoice)",
        "param": "ramble_retries / COSYVOICE_RAMBLE_RETRIES", "default": "3", "min": 0, "max": 6,
        "desc": "폭주로 판정되면 몇 번까지 다시 합성할지. 늘리면 안전해지고 그만큼 응답이 늦어진다. "
                "0이면 재합성하지 않는다",
    },
    "tts.cv_ramble_fallback_top_k": {
        "type": "number", "choices": None, "reflow": "immediate",
        "label": "재합성 top_k (cosyvoice)",
        "param": "ramble_fallback_top_k / COSYVOICE_RAMBLE_FALLBACK_TOP_K", "default": "1",
        "min": 1, "max": 50,
        "desc": "재합성할 때 쓰는 후보 폭. 1(greedy)이 폭주 20%로 가장 안정적이라 기본값이다. "
                "밋밋하지만 노이즈보다는 낫다",
    },

    # ---------------- fifth: 입모양 (per-request · 즉시) ----------------
    "fifth.lip_open": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "입 벌림",
        "param": "FIFTH_LIP_OPEN / lip_open", "default": "0.24 (라이브) · 코드 기본 0.55",
        "min": 0, "max": 1,
        "desc": "입을 최대로 벌리는 정도(c_d_lip). 크면 과장되게 벌리고, 작으면 오물거린다",
    },
    "fifth.lip_closed": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "입 닫힘",
        "param": "FIFTH_LIP_CLOSED / lip_closed", "default": "0.0023", "min": 0, "max": 0.5,
        "desc": "무음일 때 입이 닫히는 정도. 0에 가까울수록 완전히 다문다",
    },
    "fifth.open_scale": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "벌림 배율",
        "param": "FIFTH_OPEN_SCALE / open_scale", "default": "1.0", "min": 0.1, "max": 3.0,
        "desc": "입 벌림 전체 배율. 입 벌림 값을 안 건드리고 전체를 키우거나 줄일 때 쓴다",
    },
    "fifth.offset": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "입싱크 선행 프레임",
        "param": "FIFTH_OFFSET / offset", "default": "2 (= 80ms @25fps)", "min": -10, "max": 10,
        "desc": "입 움직임을 소리보다 몇 프레임 앞당길지. 입이 소리보다 늦어 보이면 올린다. "
                "음수면 뒤로 미룬다",
    },
    "fifth.sigma": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "소리 스무딩",
        "param": "FIFTH_SIGMA / sigma", "default": "1.0", "min": 0, "max": 10,
        "desc": "소리 크기를 얼마나 부드럽게 다듬을지. 크면 입이 뭉근하게 움직이고, "
                "작으면 소리에 딱 붙어 파르르 떤다",
    },
    "fifth.gamma": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "반응 곡선",
        "param": "FIFTH_GAMMA / gamma", "default": "1.0", "min": 0.1, "max": 5,
        "desc": "소리 크기를 입 벌림으로 바꾸는 곡선. 1보다 크면 작은 소리에 덜 반응해 차분해진다",
    },
    "fifth.silence": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "무음 기준",
        "param": "FIFTH_SILENCE / silence", "default": "0.05", "min": 0, "max": 1,
        "desc": "이 크기(RMS) 이하는 무음으로 보고 입을 다문다. 높이면 숨소리에 입이 안 움직인다",
    },
    "fifth.closed_thresh": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "닫힘 전환점",
        "param": "FIFTH_CLOSED_THRESH / closed_thresh", "default": "0.1", "min": 0, "max": 1,
        "desc": "사진 2장을 섞는 모드에서, 이 이하면 입 다문 사진을 쓴다",
    },
    "fifth.open_thresh": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "벌림 전환점",
        "param": "FIFTH_OPEN_THRESH / open_thresh", "default": "0.4", "min": 0, "max": 1,
        "desc": "사진 2장을 섞는 모드에서, 이 이상이면 입 벌린 사진을 쓴다",
    },
    "fifth.lip_lock": {
        "type": "bool", "choices": None, "reflow": "immediate", "label": "입 강제 다뭄",
        "param": "lip_lock", "default": "꺼짐",
        "desc": "입을 강제로 다물게 고정한다. 소리와 무관하게 안 움직인다",
    },
    "fifth.source_face_lock": {
        "type": "bool", "choices": None, "reflow": "immediate", "label": "입 원본 고정",
        "param": "source_face_lock", "default": "꺼짐",
        "desc": "입 모양을 원본 사진 그대로 잠근다(입 키포인트 6개만). 강제 다뭄보다 우선하며, "
                "억지로 다무는 게 아니라 사진의 자연스러운 입을 유지한다",
    },
    "fifth.source_face_lock_full": {
        "type": "bool", "choices": None, "reflow": "immediate", "label": "표정 전체 고정",
        "param": "source_face_lock_full", "default": "꺼짐",
        "desc": "위 고정을 눈·눈썹까지 21개 전체로 넓힌다. 표정이 원본 사진 그대로 굳어 "
                "눈이 과하게 커지는 현상이 사라진다",
    },
    "fifth.fps": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "프레임레이트",
        "param": "FIFTH_FPS / fps", "default": "25", "min": 10, "max": 60,
        "desc": "초당 프레임 수. 바꾸면 입싱크 선행 프레임의 실제 ms 도 함께 바뀐다",
    },

    # ---------------- fifth: 눈·머리 (per-request · 즉시) ----------------
    "fifth.blink": {
        "type": "bool", "choices": None, "reflow": "immediate", "label": "눈 깜빡임",
        "param": "FIFTH_BLINK / blink", "default": "켜짐",
        "desc": "눈 깜빡임을 넣는다. 끄면 눈을 안 감아 인형처럼 보인다",
    },
    "fifth.blink_interval_sec": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "깜빡임 간격(초)",
        "param": "FIFTH_BLINK_INTERVAL / blink_interval_sec", "default": "3.2",
        "min": 0.5, "max": 30,
        "desc": "평균 몇 초에 한 번 깜빡일지. 짧으면 불안해 보인다",
    },
    "fifth.eyes_open_lock": {
        "type": "bool", "choices": None, "reflow": "immediate", "label": "눈 뜬 채 고정",
        "param": "eyes_open_lock", "default": "꺼짐",
        "desc": "눈을 뜬 상태로 고정한다. 모델이 만든 눈 움직임과 깜빡임을 모두 무시한다",
    },
    "fifth.head_sway_amp": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "머리 흔들림 폭",
        "param": "head_sway_amp", "default": "미지정(안 흔듦)", "min": 0, "max": 5,
        "desc": "머리를 좌우로 흔드는 폭을 인위적으로 준다. 비우면 안 흔든다",
    },
    "fifth.head_sway_slow": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "흔들림 감속",
        "param": "head_sway_slow", "default": "1.0", "min": 0.2, "max": 10,
        "desc": "머리 흔들림 속도를 늦추는 배율. 1보다 크면 느긋하게 움직인다",
    },
    "fifth.head_yaw_offset": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "시선 좌우 보정(도)",
        "param": "head_yaw_offset", "default": "0", "min": -45, "max": 45,
        "desc": "시선을 좌우로 상수만큼 틀어 놓는다. 클론이 카메라를 안 보고 있을 때 맞춘다",
    },
    "fifth.head_pitch_offset": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "시선 상하 보정(도)",
        "param": "head_pitch_offset", "default": "0", "min": -45, "max": 45,
        "desc": "시선을 위아래로 상수만큼 틀어 놓는다",
    },
    "fifth.head_slew_frames": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "머리 이어붙임 프레임",
        "param": "FIFTH_HEAD_SLEW_FRAMES / head_slew_frames", "default": "5", "min": 0, "max": 30,
        "desc": "문장이 바뀔 때 머리 위치를 몇 프레임에 걸쳐 이어붙일지. 0이면 뚝 끊긴다",
    },
    "fifth.idle_motion_scale": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "가만히 있을 때 움직임",
        "param": "FIFTH_IDLE_MOTION_SCALE / idle_motion_scale", "default": "0.15",
        "min": 0, "max": 1,
        "desc": "말하지 않을 때 머리·표정 움직임을 얼마나 줄일지. 1.0이면 안 줄인다",
    },
    "fifth.idle_rms_low": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "정지 판정 기준",
        "param": "FIFTH_IDLE_RMS_LOW / idle_rms_low", "default": "0.05", "min": 0, "max": 1,
        "desc": "이 소리 크기 이하를 '가만히 있는 중'으로 판정한다",
    },
    "fifth.idle_rms_high": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "발화 판정 기준",
        "param": "FIFTH_IDLE_RMS_HIGH / idle_rms_high", "default": "0.3", "min": 0, "max": 1,
        "desc": "이 소리 크기 이상을 '말하는 중'으로 판정한다",
    },
    "fifth.jpeg_quality": {
        "type": "number", "choices": None, "reflow": "immediate", "label": "프레임 화질",
        "param": "jpeg_quality", "default": "90", "min": 1, "max": 100,
        "group": "latency", "stage": "송출",
        "desc": "프레임 JPEG 품질. 낮추면 인코딩·전송이 빨라지고 화질이 떨어진다",
    },
    "fifth.render_mode": {
        "type": "enum", "choices": ["partial", "batch"], "reflow": "immediate", "label": "렌더 방식",
        "param": "PRETHIRD_RENDER_MODE / render_mode", "default": "batch (라이브)",
        "group": "latency", "stage": "렌더",
        "desc": "batch 는 문장 전체를 다 만든 뒤 한 번에 보낸다(라이브 기본). "
                "partial 은 만들어지는 대로 조각내어 먼저 보낸다. 체감 지연과 끊김의 맞바꿈",
    },

    # ---------------- fifth: 기동 설정 (컨테이너 재기동) ----------------
    "fifth.cfg_scale": {
        "type": "number", "choices": None, "reflow": "container", "label": "표정 세기",
        "param": "FIFTH_CFG_SCALE", "default": "2.0 (라이브)", "min": 0.5, "max": 6,
        "desc": "머리·표정 움직임의 세기(JoyVASA). 3.5면 표정이 커지고 1.5 이하면 얼굴이 굳는다",
    },
    "fifth.driving_multiplier": {
        "type": "number", "choices": None, "reflow": "container", "label": "움직임 배율",
        "param": "FIFTH_DRIVING_MULTIPLIER", "default": "1.0", "min": 0.1, "max": 3,
        "desc": "움직임 전체 배율. 1.5 이상은 과장돼 부자연스럽다",
    },
    "fifth.head_smooth": {
        "type": "number", "choices": None, "reflow": "container", "label": "머리 속도 완화",
        "param": "FIFTH_HEAD_SMOOTH", "default": "3.5 (라이브) · 코드 기본 0=끔",
        "min": 0, "max": 10,
        "desc": "머리 움직임의 속도만 늦춘다(폭은 유지). 0이면 끄고, 3.5는 천천히, 5는 더 느리게. "
                "과하면 피크가 깎여 움직임이 뭉개진다(2~5 권장)",
    },
    "fifth.blink_dur": {
        "type": "number", "choices": None, "reflow": "container", "label": "깜빡임 길이(프레임)",
        "param": "FIFTH_BLINK_DUR", "default": "6", "min": 1, "max": 20,
        "desc": "한 번 깜빡이는 데 쓰는 프레임 수. 8이면 눈을 완전히 감는다",
    },
    "fifth.eye_source_lock": {
        "type": "bool", "choices": None, "reflow": "container", "label": "눈 원본 고정",
        "param": "FIFTH_EYE_SOURCE_LOCK", "default": "켜짐 (라이브) · 코드 기본 꺼짐",
        "desc": "가만히 있을 때 눈을 원본 사진의 눈으로 고정해 눈이 과하게 커지는 걸 막는다",
    },
    "fifth.eye_target_scale": {
        "type": "number", "choices": None, "reflow": "container", "label": "눈 뜸 정도",
        "param": "FIFTH_EYE_TARGET_SCALE", "default": "0.8 (라이브) · 코드 기본 0.5",
        "min": 0, "max": 2,
        "desc": "위 고정을 쓸 때 눈을 얼마나 뜰지 배율",
    },
    "fifth.input_normalize": {
        "type": "bool", "choices": None, "reflow": "container", "label": "사진 자동 맞춤",
        "param": "FIFTH_INPUT_NORMALIZE", "default": "켜짐",
        "desc": "사진을 얼굴 중심으로 잘라 9:16(576×1024)으로 맞춘다. 끄면 원본 그대로 쓴다",
    },
    "fifth.pasteback_output": {
        "type": "bool", "choices": None, "reflow": "container", "label": "원본 비율 송출",
        "param": "FIFTH_PASTEBACK_OUTPUT", "default": "켜짐",
        "desc": "켜면 원본 비율(세로)로 내보내고, 끄면 512×512 정사각으로 잘라 내보낸다",
    },
    "fifth.cdlip_smooth": {
        "type": "bool", "choices": None, "reflow": "container", "label": "입 추가 다듬기",
        "param": "FIFTH_CDLIP_SMOOTH", "default": "꺼짐",
        "desc": "입 움직임을 시간축으로 한 번 더 다듬는다. 떨림이 남을 때만 켠다",
    },
    "fifth.cdlip_sigma": {
        "type": "number", "choices": None, "reflow": "container", "label": "입 다듬기 강도",
        "param": "FIFTH_CDLIP_SIGMA", "default": "1.5", "min": 0.1, "max": 5,
        "desc": "위 다듬기의 강도. 입 추가 다듬기가 꺼져 있으면 효과 없다",
    },

    # ---------------- FLP 플러그인 (3층 · 컨테이너 재기동) ----------------
    "flp.animation_region": {
        "type": "enum", "choices": ["all", "exp", "pose", "lip", "eyes"],
        "reflow": "container", "label": "움직일 영역",
        "param": "FIFTH_FLP_ANIMATION_REGION", "default": "all",
        "desc": "얼굴 중 어디를 움직일지. all=전체, lip=입만, eyes=눈만, pose=머리만, exp=표정만",
    },
    "flp.flag_stitching": {
        "type": "bool", "choices": None, "reflow": "container", "label": "이음새 보정",
        "param": "FIFTH_FLP_STITCHING", "default": "켜짐",
        "desc": "생성한 얼굴을 원본에 붙일 때 경계를 보정한다. 끄면 목·머리 경계가 튄다",
    },
    "flp.flag_lip_retargeting": {
        "type": "bool", "choices": None, "reflow": "container", "label": "입 재조정",
        "param": "FIFTH_FLP_LIP_RETARGETING", "default": "켜짐 (코드 강제 · yaml 은 꺼짐)",
        "desc": "입 모양을 별도 모델로 다시 맞춘다. flp_engine 이 켜 두는 값이라 yaml 과 반대다",
    },
    "flp.flag_eye_retargeting": {
        "type": "bool", "choices": None, "reflow": "container", "label": "눈 재조정",
        "param": "FIFTH_FLP_EYE_RETARGETING", "default": "켜짐 (눈 깜빡임 설정에 연동)",
        "desc": "눈을 별도 모델로 다시 맞춘다. 깜빡임을 넣으려면 켜져 있어야 한다",
    },
    "flp.flag_pasteback": {
        "type": "bool", "choices": None, "reflow": "container", "label": "원본에 되붙이기",
        "param": "FIFTH_FLP_PASTEBACK", "default": "켜짐",
        "desc": "생성된 얼굴을 원본 프레임에 되붙인다. 끄면 잘린 얼굴만 나온다",
    },
    "flp.flag_normalize_lip": {
        "type": "bool", "choices": None, "reflow": "container", "label": "입 정규화",
        "param": "FIFTH_FLP_NORMALIZE_LIP", "default": "꺼짐 (코드 강제 · yaml 은 켜짐)",
        "desc": "입 파라미터를 정규화한다. 우리 입싱크와 충돌해 코드가 꺼 두는 값 — 실험용으로만 켠다",
    },
    "flp.lip_normalize_threshold": {
        "type": "number", "choices": None, "reflow": "container", "label": "입 정규화 임계",
        "param": "FIFTH_FLP_LIP_NORM_THRESHOLD", "default": "0.1", "min": 0, "max": 1,
        "desc": "위 정규화의 임계값. 입 정규화가 꺼져 있으면 아무 효과 없다",
    },
    "flp.cfg_scale": {
        "type": "number", "choices": None, "reflow": "container", "label": "FLP 생성 강도",
        "param": "FIFTH_FLP_CFG_SCALE", "default": "1.2", "min": 0.5, "max": 6,
        "desc": "FLP 자체의 생성 강도. 위쪽 '표정 세기'(JoyVASA)와는 다른 층의 값이다",
    },
    "flp.driving_multiplier": {
        "type": "number", "choices": None, "reflow": "container", "label": "FLP 구동 배율",
        "param": "FIFTH_FLP_DRIVING_MULTIPLIER", "default": "1.0", "min": 0.1, "max": 3,
        "desc": "FLP 층의 구동 배율. fifth 의 '움직임 배율'이 이 값을 덮어쓴다",
    },

    # ---------------- 송출 (랩/prethird 재기동) ----------------
    "transport.playback_buffer_ms": {
        "type": "number", "choices": None, "reflow": "lab_restart", "label": "재생 버퍼(ms)",
        "param": "PRETHIRD_PLAYBACK_BUFFER_MS", "default": "0", "min": 0, "max": 2000,
        "group": "latency", "stage": "송출",
        "desc": "재생 전에 쌓아 둘 시간. 늘리면 끊김이 줄고 그만큼 지연이 늘어난다",
    },
    "transport.idle_grace_sec": {
        "type": "number", "choices": None, "reflow": "lab_restart", "label": "정지 전환 유예(초)",
        "param": "IDLE_GRACE_SEC", "default": "0.5", "min": 0, "max": 10,
        "desc": "말이 끝난 뒤 가만히 있는 영상으로 넘어가기까지 기다리는 시간",
    },
    "transport.width": {
        "type": "number", "choices": None, "reflow": "lab_restart", "label": "가로 해상도",
        "param": "PRETHIRD_WIDTH", "default": "576", "min": 128, "max": 2048,
        "desc": "송출 영상 가로 픽셀. 올리면 선명해지고 인코딩·전송이 무거워진다",
    },
    "transport.height": {
        "type": "number", "choices": None, "reflow": "lab_restart", "label": "세로 해상도",
        "param": "PRETHIRD_HEIGHT", "default": "1024", "min": 128, "max": 2048,
        "desc": "송출 영상 세로 픽셀. 576×1024 가 9:16 세로 기준이다",
    },
    "transport.idle_source_mode": {
        "type": "enum", "choices": ["auto", "prebake", "clone_mp4", "fallback"],
        "reflow": "lab_restart", "label": "정지 영상 소스",
        "param": "IDLE_SOURCE_MODE", "default": "auto",
        "desc": "말하지 않을 때 보여줄 영상. auto=자동 선택, prebake=미리 만든 것, "
                "clone_mp4=클론 영상, fallback=기본 얼굴",
    },

    # ---------------- 필러 (랩/prethird 재기동) ----------------
    "filler.enabled": {
        "type": "bool", "choices": None, "reflow": "lab_restart", "label": "필러 사용",
        "param": "PRETHIRD_FILLER", "default": "꺼짐",
        "group": "latency", "stage": "체감",
        "desc": "응답을 만드는 동안 '음…' 같은 소리를 먼저 낸다. 실제 지연은 그대로고 체감만 나아진다",
    },
    "filler.volume": {
        "type": "number", "choices": None, "reflow": "lab_restart", "label": "필러 볼륨",
        "param": "(filler_player volume)", "default": "0.3", "min": 0, "max": 1,
        "desc": "필러 소리 크기. 너무 크면 본 응답과 어색하게 이어진다",
    },
    "filler.padding_sec": {
        "type": "number", "choices": None, "reflow": "lab_restart", "label": "필러 뒤 여백(초)",
        "param": "(filler_player padding)", "default": "0", "min": 0, "max": 5,
        "desc": "필러가 끝나고 본 응답이 시작되기까지 두는 여백",
    },
    "filler.lookahead_sec": {
        "type": "number", "choices": None, "reflow": "lab_restart", "label": "필러 대기(초)",
        "param": "FILLER_LOOKAHEAD_SEC", "default": "1.0", "min": 0, "max": 10,
        "group": "latency", "stage": "체감",
        "desc": "응답이 이 시간 안에 안 오면 필러를 낸다. 짧으면 필러가 자주 끼어든다",
    },
    "filler.blend_frames": {
        "type": "number", "choices": None, "reflow": "lab_restart", "label": "장면 전환 프레임",
        "param": "PRETHIRD_IDLE_BLEND_FRAMES", "default": "5", "min": 0, "max": 30,
        "desc": "정지 영상과 말하는 영상 사이를 몇 프레임에 걸쳐 섞을지. 0이면 뚝 바뀐다",
    },
    "filler.idle_prebake": {
        "type": "bool", "choices": None, "reflow": "lab_restart", "label": "정지 영상 미리 굽기",
        "param": "FIFTH_IDLE_PREBAKE", "default": "켜짐",
        "group": "latency", "stage": "렌더",
        "desc": "가만히 있는 영상을 미리 만들어 둔다. 첫 프레임이 빨라지는 대신 기동이 느려진다",
    },
    "filler.order": {
        "type": "enum", "choices": ["pre_speak", "off"], "reflow": "lab_restart",
        "label": "필러 재생 순서",
        "param": "PRETHIRD_FILLER_ORDER", "default": "pre_speak",
        "desc": "pre_speak 는 본 응답 직전에 필러를 낸다. off 는 필러를 내지 않는다",
    },

    # --- 업로드 소스(랩 전용) ---------------------------------------------
    # reflow=session 근거: pipeline_factory.factory(sess) 가 offer 마다 불린다
    # (signaling.py:1426) → 다음 통화부터 반영.
    "source.render_source": {
        "type": "string", "choices": None, "reflow": "session",
        "label": "렌더 소스(업로드)",
        "param": "lab-sources/{id}/source.*", "default": "(클론 기본)",
        "desc": "업로드한 영상·사진으로 얼굴을 대체한다. 목소리·성격은 선택한 클론 것을 "
                "그대로 쓴다. 빈 값이면 클론 원래 자산",
    },
    "source.use_idle": {
        "type": "bool", "choices": None, "reflow": "session",
        "label": "업로드본으로 정지 영상도 교체",
        "param": "lab-sources/{id}/idle.mp4", "default": "켜짐",
        "desc": "말하지 않는 동안 보여줄 영상도 업로드본으로 만든다. 끄면 말할 때만 "
                "업로드 얼굴이고 쉴 때는 클론 얼굴이라 화면이 튄다",
    },
    "source.mute_filler": {
        "type": "bool", "choices": None, "reflow": "session",
        "label": "업로드 중 클론 필러 끄기",
        "param": "sess.filler_player", "default": "켜짐",
        "desc": "필러 영상은 클론 얼굴로 미리 구워둔 것이라 업로드 얼굴과 섞이면 "
                "다른 사람이 튀어나온다. 켜두는 것을 권장",
    },
    "source.voice_source": {
        "type": "string", "choices": None, "reflow": "session",
        "label": "목소리(업로드)",
        "param": "reference_voices/{id}/voice.wav", "default": "(클론 기본)",
        "desc": "업로드한 음성으로 목소리를 대체한다. 얼굴·성격은 선택한 클론 것을 "
                "그대로 쓴다. 빈 값이면 클론 원래 목소리",
    },
}
