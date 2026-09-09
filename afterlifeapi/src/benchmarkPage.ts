

import { B1_B64, HAPPY_B64, JAMO_B64 } from "./benchmarkVideos";

export const BENCHMARK_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="afterlife 2D 얼굴 애니메이션 3방식 실측 비교 · 3D 유료 파이프라인 도입 근거 자료">
<meta name="robots" content="noindex">
<title>얼굴 렌더 실측 · afterlife</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400..900,0..100,0..1&family=Instrument+Sans:wght@400;500;600&family=Gowun+Batang:wght@400;700&family=Gothic+A1:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
  :root {
    --ground: #EAE7DE;
    --ink: #141312;
    --muted: #66625A;
    --rule: #231F1B;
    --bad: #8B2A1F;
    --good: #3D5A3F;
    --paper: #F3F1EA;

    --serif: "Fraunces", "Gowun Batang", ui-serif, Georgia, serif;
    --sans: "Instrument Sans", "Gothic A1", -apple-system, system-ui, sans-serif;
    --mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #1A1815;
      --ink: #E9E5DA;
      --muted: #928C82;
      --rule: #C7C1B6;
      --bad: #E27363;
      --good: #86A98A;
      --paper: #221F1B;
    }
  }
  :root[data-theme="dark"] {
    --ground: #1A1815;
    --ink: #E9E5DA;
    --muted: #928C82;
    --rule: #C7C1B6;
    --bad: #E27363;
    --good: #86A98A;
    --paper: #221F1B;
  }

  html, body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  * { box-sizing: border-box; }

  a { color: var(--ink); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
  a:hover { color: var(--bad); }
  a:focus-visible { outline: 2px solid var(--rule); outline-offset: 3px; }

  .page { max-width: 1280px; margin: 0 auto; padding: 22px 56px 96px; }
  @media (max-width: 780px) { .page { padding: 20px 22px 72px; } }

  .mast {
    display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 24px;
    padding: 8px 0 12px; border-bottom: 1px solid var(--rule);
    font-family: var(--mono); font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.14em; color: var(--muted);
  }
  .mast .brand { color: var(--ink); font-weight: 500; }
  .mast .meta { text-align: right; }

  .hero {
    display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 56px; padding: 68px 0 72px; border-bottom: 1px solid var(--rule);
  }
  @media (max-width: 900px) { .hero { grid-template-columns: 1fr; gap: 44px; padding: 44px 0 48px; } }

  .eyebrow {
    font-family: var(--mono); font-size: 12px; text-transform: uppercase;
    letter-spacing: 0.2em; color: var(--bad); margin-bottom: 26px;
    display: flex; align-items: center; gap: 12px;
  }
  .eyebrow::before { content: ""; display: inline-block; width: 22px; height: 1px; background: currentColor; }

  .verdict {
    font-family: var(--serif); font-variation-settings: "opsz" 144, "SOFT" 30, "WONK" 0;
    font-weight: 900; font-size: clamp(56px, 8.4vw, 116px); line-height: 0.92;
    letter-spacing: -0.03em; text-wrap: balance; margin: 0; color: var(--ink);
  }
  .verdict em { font-style: italic; font-variation-settings: "opsz" 144, "SOFT" 100; color: var(--bad); }

  .lede { margin: 30px 0 0; font-size: 18px; line-height: 1.5; max-width: 34em; color: var(--ink); }
  .lede strong { font-weight: 600; }

  .metrics { align-self: end; display: flex; flex-direction: column; gap: 0; border-top: 2px solid var(--rule); }
  .metric {
    padding: 22px 0 20px; border-bottom: 1px solid var(--rule);
    display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 20px;
  }
  .metric .label { font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); }
  .metric .value {
    font-family: var(--serif); font-variation-settings: "opsz" 144, "SOFT" 20;
    font-weight: 900; font-size: clamp(48px, 6.2vw, 84px); line-height: 0.9;
    letter-spacing: -0.03em; color: var(--ink); font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .metric .value.bad { color: var(--bad); }
  .metric .value .sub {
    font-family: var(--sans); font-weight: 500; font-size: 0.32em; letter-spacing: 0;
    color: var(--muted); margin-left: 4px; vertical-align: 0.55em;
  }
  @media (max-width: 640px) {
    .metric {
      grid-template-columns: 1fr;
      gap: 4px;
      padding: 20px 0 22px;
    }
    .metric .label { order: 1; }
    .metric .value { order: 2; font-size: 52px; line-height: 1; }
  }

  .section {
    display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 56px; padding: 64px 0; border-bottom: 1px solid var(--rule);
  }
  @media (max-width: 900px) { .section { grid-template-columns: 1fr; gap: 32px; padding: 44px 0; } }

  .method-index { font-family: var(--mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 20px; }
  .method-index .num { color: var(--ink); margin-right: 10px; }

  .method-name {
    font-family: var(--serif); font-variation-settings: "opsz" 96, "SOFT" 30;
    font-weight: 800; font-size: clamp(38px, 5.2vw, 62px); line-height: 0.98;
    letter-spacing: -0.02em; margin: 0 0 12px; text-wrap: balance;
  }
  .method-sub {
    font-family: var(--serif); font-variation-settings: "opsz" 24;
    font-weight: 400; font-style: italic; font-size: 20px; line-height: 1.35;
    color: var(--muted); margin: 0 0 30px; max-width: 30em;
  }

  .prose { max-width: 34em; font-size: 15.5px; line-height: 1.65; }
  .prose p { margin: 0 0 14px; }
  .prose p:last-child { margin-bottom: 0; }

  .sidebar { border-top: 2px solid var(--rule); }
  .row {
    display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline;
    gap: 20px; padding: 14px 0 12px;
    border-bottom: 1px dashed color-mix(in oklab, var(--rule) 45%, transparent);
  }
  .row .k { font-family: var(--sans); font-size: 13.5px; color: var(--muted); line-height: 1.35; }
  .row .v {
    font-family: var(--mono); font-size: 13.5px; font-weight: 500; color: var(--ink);
    text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .row .v.bad { color: var(--bad); }
  .row .v.good { color: var(--good); }

  .verdict-tag {
    margin-top: 22px; padding: 12px 16px; background: var(--paper);
    border-left: 3px solid var(--bad); font-family: var(--sans);
    font-size: 13.5px; line-height: 1.5; color: var(--ink);
  }
  .verdict-tag .prefix {
    font-family: var(--mono); font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.16em; color: var(--bad); margin-right: 8px; font-weight: 700;
  }

  .callout-eighteen {
    grid-column: 1 / -1; margin: 8px 0 26px;
    display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: end;
    gap: 40px; padding: 10px 0 22px;
    border-bottom: 1px solid color-mix(in oklab, var(--rule) 40%, transparent);
  }
  @media (max-width: 700px) { .callout-eighteen { grid-template-columns: 1fr; gap: 12px; } }
  .callout-eighteen .num {
    font-family: var(--serif); font-variation-settings: "opsz" 144, "SOFT" 10, "WONK" 1;
    font-weight: 900; font-size: clamp(140px, 26vw, 300px); line-height: 0.82;
    letter-spacing: -0.05em; color: var(--bad); font-variant-numeric: tabular-nums;
  }
  .callout-eighteen .caption { padding-bottom: 12px; max-width: 26em; }
  .callout-eighteen .caption strong {
    font-family: var(--serif); font-variation-settings: "opsz" 24;
    font-weight: 600; font-size: 18px; display: block; margin-bottom: 6px;
  }
  .callout-eighteen .caption span {
    font-family: var(--mono); font-size: 12px; text-transform: uppercase;
    letter-spacing: 0.16em; color: var(--muted);
  }

  .video-grid {
    grid-column: 1 / -1; margin: 4px 0 30px;
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px;
  }
  @media (max-width: 700px) { .video-grid { grid-template-columns: 1fr; gap: 14px; } }
  .video-grid figure { margin: 0; }
  .video-grid .video-solo { grid-column: 1 / -1; max-width: 480px; margin: 0 auto; width: 100%; }
  .video-grid video {
    width: 100%; aspect-ratio: 1 / 1; display: block; object-fit: cover;
    background: var(--paper);
    border: 1px solid color-mix(in oklab, var(--rule) 55%, transparent);
  }
  .video-grid figcaption {
    font-family: var(--mono); font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.16em; color: var(--muted); margin-top: 8px;
  }
  .video-grid figcaption strong {
    color: var(--ink); font-weight: 700; margin-right: 8px;
  }

  .conclusion { padding: 80px 0 32px; border-bottom: 1px solid var(--rule); }
  .conclusion .eyebrow { color: var(--good); }
  .conclusion .verdict em { color: var(--good); }
  .conclusion .grid {
    display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 56px; margin-top: 44px;
  }
  @media (max-width: 900px) { .conclusion .grid { grid-template-columns: 1fr; gap: 32px; } }

  .why-list { list-style: none; padding: 0; margin: 0; border-top: 2px solid var(--rule); }
  .why-list li {
    display: grid; grid-template-columns: auto minmax(0, 1fr);
    gap: 24px; padding: 22px 0 20px; border-bottom: 1px solid var(--rule);
  }
  .why-list .why-num {
    font-family: var(--serif); font-variation-settings: "opsz" 60;
    font-weight: 800; font-size: 32px; line-height: 1;
    color: var(--good); font-variant-numeric: tabular-nums; margin-top: 2px;
  }
  .why-list h4 {
    font-family: var(--serif); font-variation-settings: "opsz" 24;
    font-weight: 600; font-size: 19px; margin: 0 0 6px; line-height: 1.2;
  }
  .why-list p {
    margin: 0; font-size: 14.5px; line-height: 1.55;
    color: color-mix(in oklab, var(--ink) 85%, var(--muted));
  }

  .next {
    margin-top: 40px; padding: 22px 26px; background: var(--paper);
    border-left: 3px solid var(--good);
  }
  .next .prefix {
    font-family: var(--mono); font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.18em; color: var(--good); font-weight: 700; margin-right: 10px;
  }
  .next-body { font-family: var(--sans); font-size: 14.5px; line-height: 1.6; color: var(--ink); margin-top: 8px; }

  footer.foot {
    padding: 40px 0 0; display: grid; grid-template-columns: 1fr auto;
    gap: 24px; align-items: baseline;
    font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
  }
  footer.foot .links { display: flex; flex-wrap: wrap; gap: 20px; justify-content: flex-end; }
  @media (max-width: 700px) {
    footer.foot { grid-template-columns: 1fr; }
    footer.foot .links { justify-content: flex-start; }
  }
  footer.foot a { color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--rule); padding-bottom: 2px; }
  footer.foot a:hover { color: var(--bad); border-bottom-color: var(--bad); }

  ::selection { background: var(--ink); color: var(--ground); }
</style>
</head>
<body>
<div class="page">

  <header class="mast">
    <div class="brand">afterlife · Face Render Track</div>
    <div class="meta">Vol. 01 · No. 01 &nbsp;·&nbsp; 2026-09-08 · 회의용 근거자료</div>
  </header>

  <section class="hero">
    <div>
      <div class="eyebrow">Verdict on 2D Server-Side Lip Sync</div>
      <h1 class="verdict">서버측 2D 는<br><em>못 만듭니다.</em></h1>
      <p class="lede">
        자모 프레임 캡처 · EchoMimicV3 · MuseTalk 세 방식 모두
        <strong>자연스러움 · 속도 · 정확도</strong> 셋 중 하나 이상이
        반드시 무너진다. 자체 개발 능력·현재 인프라 조건에서 실시간
        통화용으로 채택할 수 있는 서버측 2D 파이프라인은 없다.
      </p>
    </div>

    <aside class="metrics" aria-label="핵심 실측 수치 3">
      <div class="metric">
        <div class="label">자연스러운 5초 발화에 필요한 프레임</div>
        <div class="value bad">2,000<span class="sub">장</span></div>
      </div>
      <div class="metric">
        <div class="label">EchoMimicV3 · 3초 대사 렌더 시간</div>
        <div class="value bad">18<span class="sub">초</span></div>
      </div>
      <div class="metric">
        <div class="label">MuseTalk 입 모양 정확도</div>
        <div class="value bad">낮음</div>
      </div>
    </aside>
  </section>

  <section class="section" id="m1">
    <div>
      <div class="method-index"><span class="num">① 방식</span> 자모 프레임 캡처</div>
      <h2 class="method-name">가나다라마바사 사진</h2>
      <p class="method-sub">
        자모별 입 모양을 미리 촬영해 TTS 순서에 맞춰
        이어붙이는 가장 단순한 접근.
      </p>
      <div class="video-grid" aria-label="자모 프레임 캡처 실측">
        <figure class="video-solo">
          <video autoplay muted loop playsinline preload="metadata"
                 src="data:video/mp4;base64,${JAMO_B64}"></video>
          <figcaption><strong>자모 14장 이어붙임</strong> 5차 시제 실측 · 뚝뚝 끊긴다</figcaption>
        </figure>
      </div>
      <div class="prose">
        <p>
          자연스럽게 보이려면 5초 발화당 대략 2,000장의 프레임이 필요하다.
          이는 실사 영화가 요구하는 24fps 기준을 크게 밑도는 수치조차 아니다 —
          같은 밀도로 촬영해야 한다는 뜻이다. 실제 확보한 프레임은 자모 40~60장
          수준에 불과했다.
        </p>
        <p>
          이미지 몇 십 장을 15fps 로 재생해봐야 사람은 여전히 <em>뚝뚝 끊기는</em>
          장면을 본다. 얼굴이 말하는 것이 아니라 얼굴 사진 여러 장이 순서대로
          바뀌는 것으로 인지된다. 지호가 선행 시제로 시도해 폐기한 이력이 있다.
        </p>
      </div>
    </div>

    <aside class="sidebar" aria-label="자모 프레임 캡처 실측">
      <div class="row"><div class="k">필요 프레임 (5초 발화)</div><div class="v bad">≈ 2,000장</div></div>
      <div class="row"><div class="k">실제 확보 프레임</div><div class="v bad">40~60장</div></div>
      <div class="row"><div class="k">재생 fps</div><div class="v">15 fps</div></div>
      <div class="row"><div class="k">체감 자연스러움</div><div class="v bad">매우 낮음</div></div>
      <div class="row"><div class="k">서버 GPU 비용</div><div class="v good">없음</div></div>
      <div class="row"><div class="k">저장 비용</div><div class="v good">낮음</div></div>
      <div class="row"><div class="k">표정 · 감정</div><div class="v bad">불가</div></div>
      <div class="verdict-tag">
        <span class="prefix">판정</span>
        개발 리소스 대비 품질 부족. 프로덕션 불가.
      </div>
    </aside>
  </section>

  <section class="section" id="m2">
    <div>
      <div class="method-index"><span class="num">② 방식</span> EchoMimicV3 · Diffusion</div>
      <h2 class="method-name">신경망이 매 프레임을 새로 그린다.</h2>
      <p class="method-sub">
        얼굴 이미지 1장 + 음성 → Diffusion 네트워크가 프레임 단위로
        배치 렌더. 자연스러움 최상, 그러나 —
      </p>
      <div class="callout-eighteen">
        <div class="num">18</div>
        <div class="caption">
          <strong>3초짜리 대사 하나에 이론 최소 18초.</strong>
          <span>3초 · 프레임 75개 · 프레임당 0.5s</span>
        </div>
      </div>
      <div class="video-grid" aria-label="EchoMimicV3 실측 렌더 샘플">
        <figure>
          <video autoplay muted loop playsinline preload="metadata"
                 src="data:video/mp4;base64,${B1_B64}"></video>
          <figcaption><strong>SAMPLE A</strong> 2초 발화 · 8step · 768</figcaption>
        </figure>
        <figure>
          <video autoplay muted loop playsinline preload="metadata"
                 src="data:video/mp4;base64,${HAPPY_B64}"></video>
          <figcaption><strong>SAMPLE B</strong> 감정 렌더 · happy</figcaption>
        </figure>
      </div>
      <div class="prose">
        <p>
          Diffusion 아키텍처는 실시간 스트리밍을 목적으로 설계되지 않았다.
          매 프레임을 배치로 만들기 때문에 3초 대사 하나에 이론 최소
          18초가 든다. 튜닝으로 속도를 절반 줄여도 실시간 통화는 아니다.
        </p>
        <p>
          chunked 스트리밍으로 첫 chunk 를 앞당겨도 <em>첫 chunk 지연</em>과
          <em>사용자당 서버 GPU 비용</em>은 남는다. 아키텍처 자체의 한계이지,
          우리의 튜닝 부족이 아니다.
        </p>
      </div>
    </div>

    <aside class="sidebar" aria-label="EchoMimicV3 실측">
      <div class="row"><div class="k">3초 대사 프레임 수</div><div class="v">≈ 75</div></div>
      <div class="row"><div class="k">프레임당 렌더 (현 GPU)</div><div class="v bad">0.5 s</div></div>
      <div class="row"><div class="k">3초 대사 총 렌더</div><div class="v bad">≥ 18 s</div></div>
      <div class="row"><div class="k">실시간 여부</div><div class="v bad">불가</div></div>
      <div class="row"><div class="k">자연스러움</div><div class="v good">최상</div></div>
      <div class="row"><div class="k">GPU 요구</div><div class="v bad">A100급+</div></div>
      <div class="row"><div class="k">사용자당 서버 비용</div><div class="v bad">매우 높음</div></div>
      <div class="verdict-tag">
        <span class="prefix">판정</span>
        아키텍처 자체가 실시간에 맞지 않는다. 프로덕션 불가.
      </div>
    </aside>
  </section>

  <section class="section" id="m3">
    <div>
      <div class="method-index"><span class="num">③ 방식</span> MuseTalk · 입 영역 대체</div>
      <h2 class="method-name">얼굴은 재생, 입만 갈아 끼움.</h2>
      <p class="method-sub">
        기본 얼굴 영상은 미리 만들어 재생하고, 음성에 맞춰
        입 영역만 실시간으로 덧그린다.
      </p>
      <div class="prose">
        <p>
          속도는 세 방식 중 유일하게 실시간에 도달한다. 그러나 입 모양
          정확도는 한국어에서 특히 취약하다 — 음소별 입 형태가 학습된 얼굴
          영상에 강하게 종속되기 때문이다.
        </p>
        <p>
          표정은 베이스 영상이 결정한다. 결국 관객은 <em>입만 다른 얼굴처럼
          움직이는 사람</em>을 본다. "고인의 얼굴로 자연스럽게 대화한다" 는
          서비스 컨셉과 정면으로 배치된다.
        </p>
      </div>
    </div>

    <aside class="sidebar" aria-label="MuseTalk 실측">
      <div class="row"><div class="k">렌더 지연</div><div class="v good">거의 없음</div></div>
      <div class="row"><div class="k">입 모양 정확도</div><div class="v bad">낮음</div></div>
      <div class="row"><div class="k">표정 다양성</div><div class="v bad">베이스 영상에 고정</div></div>
      <div class="row"><div class="k">GPU 요구</div><div class="v">중간</div></div>
      <div class="row"><div class="k">체감 이질감</div><div class="v bad">높음</div></div>
      <div class="row"><div class="k">고인 재현 컨셉과 궁합</div><div class="v bad">배치</div></div>
      <div class="verdict-tag">
        <span class="prefix">판정</span>
        속도는 되지만 품질·컨셉이 불일치. 프로덕션 불가.
      </div>
    </aside>
  </section>

  <section class="conclusion" id="conclusion">
    <div class="eyebrow">다음 방향</div>
    <h2 class="verdict">그래서 <em>3D 로 간다.</em></h2>

    <div class="grid">
      <ol class="why-list" aria-label="왜 3D 인가">
        <li>
          <div class="why-num">01</div>
          <div>
            <h4>속도</h4>
            <p>3D 는 얼굴 메시 + 블렌드셰이프 조작이라 클라이언트 GPU 만으로도
              60fps 실시간 렌더가 가능하다. 서버가 프레임을 그리지 않아도 된다.</p>
          </div>
        </li>
        <li>
          <div class="why-num">02</div>
          <div>
            <h4>입 모양 정확도</h4>
            <p>한국어 자모 → 블렌드셰이프 매핑을 정밀하게 하면 음성과
              프레임 단위로 동기된 입 모양이 나온다. 방식 ③ 의 한국어 취약점을
              구조적으로 회피한다.</p>
          </div>
        </li>
        <li>
          <div class="why-num">03</div>
          <div>
            <h4>서버 비용</h4>
            <p>렌더가 클라이언트로 이관되어 서버 GPU 비용이 사실상 사라진다.
              방식 ② 의 사용자당 비용 문제가 없어진다.</p>
          </div>
        </li>
        <li>
          <div class="why-num">04</div>
          <div>
            <h4>확장성</h4>
            <p>표정·감정·시선 등을 파라미터로 즉시 추가할 수 있다.
              2D 는 새 표정이 필요할 때마다 재촬영이나 재훈련이 필요했다.</p>
          </div>
        </li>
      </ol>

      <div>
        <div class="next">
          <div><span class="prefix">Next Step</span></div>
          <div class="next-body">
            <strong style="font-weight:600">T-694 Phase 4 스캐폴딩</strong>
            (한국어 자모 → Avatar SDK 블렌드셰이프 매핑) 기반으로 시제품 제작.
            발화 자연스러움 실측 후 유료 라이센스 승인 요청.
          </div>
        </div>

        <div style="margin-top:28px; font-family: var(--sans); font-size: 13.5px; line-height: 1.65; color: var(--muted);">
          <p style="margin: 0 0 8px;">
            <strong style="color: var(--ink); font-weight:600">측정 근거</strong>
          </p>
          <p style="margin: 0;">
            EchoMimicV3 는 자체 gabia GPU 서버 (Diffusion pipeline) 실측 ·
            자모 캡처는 지호 선행 시제 폐기 이력 · MuseTalk 은 공개 벤치 및
            자체 로컬 테스트 기준.
          </p>
        </div>
      </div>
    </div>
  </section>

  <footer class="foot">
    <div>afterlife · Face Render Benchmark · T-708</div>
    <div class="links">
      <a href="https://github.com/XrunMeta/afterlife26/blob/preview/afterlife-server/lab-tuner/FACE-ANIMATION-BENCHMARK.md">Doc</a>
      <a href="https://github.com/XrunMeta/afterlife26/pull/1310">PR #1310</a>
    </div>
  </footer>

</div>
</body>
</html>`;
