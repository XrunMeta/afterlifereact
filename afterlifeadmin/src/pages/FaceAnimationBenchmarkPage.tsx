

const COLORS = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  bad: "#dc2626",
  warn: "#d97706",
  good: "#16a34a",
  accent: "#3b82f6",
  headerBg: "#0f172a",
};

interface Method {
  key: "framecap" | "echomimic" | "musetalk";
  name: string;
  subtitle: string;
  principle: string;
  metrics: { label: string; value: string; tone: "bad" | "warn" | "good" | "neutral" }[];
  pros: string[];
  cons: string[];
  verdict: string;
  verdictTone: "bad" | "warn";
}

const METHODS: Method[] = [
  {
    key: "framecap",
    name: "① 자모 프레임 캡처 (가나다라마바사)",
    subtitle: "미리 찍은 자모별 얼굴 사진을 이어 붙이는 방식",
    principle:
      "각 한글 자모(가·나·다·라...)에 대응하는 입 모양 사진을 사전 촬영해두고, TTS 결과에 맞춰 자모 순서대로 이미지를 표시. 15fps 정도로 재생.",
    metrics: [
      { label: "필요 프레임 수 (자연스럽게)", value: "5초당 약 2,000장", tone: "bad" },
      { label: "실제 확보한 프레임", value: "자모 40~60장 수준", tone: "bad" },
      { label: "재생 fps", value: "15fps (선행 시연)", tone: "warn" },
      { label: "체감 자연스러움", value: "매우 낮음 (뚝뚝 끊김)", tone: "bad" },
      { label: "저장 비용", value: "낮음 (수십장 이미지)", tone: "good" },
    ],
    pros: [
      "이미지 전송만 하면 되므로 서버 GPU 비용 없음",
      "클라이언트 렌더 부담 낮음",
      "구조 단순, 구현 빠름",
    ],
    cons: [
      "자연스러움을 얻으려면 실사 촬영 몇 천 장 필요 → 실질 불가",
      "실사 촬영 없이 자모 몇 십 장으로는 뚝뚝 끊기는 그림",
      "표정·감정 변화 표현 불가 (입 모양만)",
      "지호가 이미 시도해서 폐기한 이력 존재",
    ],
    verdict: "개발 리소스 대비 품질 부족 · 프로덕션 불가",
    verdictTone: "bad",
  },
  {
    key: "echomimic",
    name: "② EchoMimicV3 (Diffusion 신경망)",
    subtitle: "얼굴 이미지 1장 + 음성 → 프레임 단위로 립싱크 영상 생성",
    principle:
      "Diffusion 아키텍처가 매 프레임을 배치 렌더링. 음성 신호에 맞춰 입 모양·얼굴 근육을 새로 생성. 자연스러움 최상.",
    metrics: [
      { label: "3초 발화 프레임 수", value: "약 75프레임 (25fps 기준)", tone: "neutral" },
      { label: "프레임당 렌더 시간 (현 GPU)", value: "약 0.5초", tone: "bad" },
      { label: "3초 발화 총 렌더 시간", value: "이론 최소 18초", tone: "bad" },
      { label: "실시간 여부", value: "불가 (배치 필수)", tone: "bad" },
      { label: "자연스러움", value: "최상 (실사에 가까움)", tone: "good" },
      { label: "GPU 요구", value: "고사양 (A100급 이상)", tone: "warn" },
    ],
    pros: [
      "실사에 가까운 자연스러운 얼굴 움직임 · 입 모양 정확",
      "얼굴 이미지 1장만 준비하면 다양한 발화 재현 가능",
      "감정·표정 변화까지 커버",
    ],
    cons: [
      "3초 대사에 18초 렌더 → 실시간 통화 불가능 (아키텍처 한계)",
      "chunked 스트리밍 해도 첫 chunk 나오기까지 지연 큼",
      "고사양 GPU 필수 → 사용자당 서버 비용 급증",
      "튜닝으로 속도 절반 줄여도 여전히 실시간 불가",
    ],
    verdict: "아키텍처 자체가 실시간 통화에 맞지 않음 · 프로덕션 불가",
    verdictTone: "bad",
  },
  {
    key: "musetalk",
    name: "③ MuseTalk (베이스 영상 + 립싱크)",
    subtitle: "미리 만든 얼굴 영상을 재생하며 입 모양만 갈아 끼움",
    principle:
      "기본 얼굴 영상은 미리 준비된 것을 재생하고, 음성에 맞춰 입 영역만 실시간 대체. 렌더링 부담 매우 낮음.",
    metrics: [
      { label: "렌더 지연", value: "거의 없음 (실시간)", tone: "good" },
      { label: "입 모양 정확도", value: "낮음 (베이스 영상 종속)", tone: "bad" },
      { label: "표정 다양성", value: "베이스 영상에 고정", tone: "bad" },
      { label: "GPU 요구", value: "중간", tone: "warn" },
      { label: "체감 이질감", value: "높음 (입만 다른 얼굴처럼)", tone: "bad" },
    ],
    pros: [
      "실시간 재생 가능한 유일한 서버측 옵션",
      "GPU 요구가 EchoMimic 보다 훨씬 낮음",
    ],
    cons: [
      "입 모양이 음성과 정확히 맞지 않음 (한국어 특히 취약)",
      "베이스 영상 표정만 반복 → 부자연스러움",
      "실제 대화하는 느낌 안 남",
      "고인의 얼굴 재현 목적과 배치",
    ],
    verdict: "속도는 되지만 품질 불충분 · 서비스 컨셉과 불일치",
    verdictTone: "bad",
  },
];

function ToneColor(tone: "bad" | "warn" | "good" | "neutral"): string {
  return tone === "bad"
    ? COLORS.bad
    : tone === "warn"
    ? COLORS.warn
    : tone === "good"
    ? COLORS.good
    : COLORS.text;
}

function MethodCard({ m }: { m: Method }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.methodName}>{m.name}</h3>
        <div style={styles.methodSubtitle}>{m.subtitle}</div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>원리</div>
        <div style={styles.principle}>{m.principle}</div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>실측 지표</div>
        <table style={styles.metricsTable}>
          <tbody>
            {m.metrics.map((r) => (
              <tr key={r.label}>
                <td style={styles.metricLabel}>{r.label}</td>
                <td style={{ ...styles.metricValue, color: ToneColor(r.tone) }}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.prosConsGrid}>
        <div>
          <div style={{ ...styles.sectionLabel, color: COLORS.good }}>장점</div>
          <ul style={styles.list}>
            {m.pros.map((p, i) => (
              <li key={i} style={styles.listItem}>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div style={{ ...styles.sectionLabel, color: COLORS.bad }}>단점</div>
          <ul style={styles.list}>
            {m.cons.map((c, i) => (
              <li key={i} style={styles.listItem}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          ...styles.verdictBox,
          backgroundColor: m.verdictTone === "bad" ? "#fef2f2" : "#fffbeb",
          borderColor: m.verdictTone === "bad" ? "#fecaca" : "#fde68a",
          color: m.verdictTone === "bad" ? COLORS.bad : COLORS.warn,
        }}
      >
        판정 · {m.verdict}
      </div>
    </div>
  );
}

export function FaceAnimationBenchmarkPage() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>2D 얼굴 애니메이션 3방식 실측 비교</h1>
        <div style={styles.subtitle}>
          서버측 2D 렌더 방식이 프로덕션 통화에 부적합함을 검증한 자료 · 유료 3D 파이프라인 도입의
          근거
        </div>
      </div>

      <div style={styles.summaryBanner}>
        <div style={styles.summaryLabel}>결론</div>
        <div style={styles.summaryText}>
          자체 개발 능력으로 서버측 2D 실시간 립싱크는 실현 불가. 자연스러움·속도·정확도 셋 중 하나
          이상이 반드시 무너짐. <strong>3D 유료 파이프라인 (예: Avatar SDK) 도입</strong>이 유일한
          현실적 경로.
        </div>
      </div>

      <div style={styles.cardsGrid}>
        {METHODS.map((m) => (
          <MethodCard key={m.key} m={m} />
        ))}
      </div>

      <div style={styles.conclusionBox}>
        <h2 style={styles.conclusionTitle}>왜 3D 인가</h2>
        <ul style={styles.conclusionList}>
          <li>
            <strong>속도</strong>: 3D 는 얼굴 메시 + 블렌드 셰이프 조작이라 클라이언트 GPU 만으로도
            60fps 실시간 렌더 가능
          </li>
          <li>
            <strong>정확도</strong>: 자모 → 블렌드 셰이프 매핑을 정확히 하면 입 모양이 음성과 프레임
            단위로 동기
          </li>
          <li>
            <strong>서버 비용</strong>: 렌더가 클라이언트 이관 → 서버 GPU 비용 대폭 절감
          </li>
          <li>
            <strong>확장성</strong>: 표정·감정·시선 등 파라미터 추가 용이 (2D 는 매번 재촬영·재훈련
            필요)
          </li>
        </ul>
        <div style={styles.nextSteps}>
          <strong>다음 단계</strong>: T-694 (한국어 자모 → Avatar SDK 블렌드 셰이프 매핑) 기반으로
          시제품 제작 · 발화 자연스러움 실측 → 유료 라이센스 승인 요청.
        </div>
      </div>

      <div style={styles.footer}>
        측정 근거: EchoMimicV3 는 자체 gabia GPU 서버 (Diffusion pipeline) 실측 · 자모 캡처는 지호
        선행 시제 폐기 이력 · MuseTalk 은 공개 벤치 및 자체 로컬 테스트 기준.
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
    backgroundColor: COLORS.bg,
    minHeight: "100vh",
    color: COLORS.text,
  } as const,
  header: {
    marginBottom: 20,
  } as const,
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  } as const,
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.muted,
  } as const,
  summaryBanner: {
    marginBottom: 24,
    padding: "16px 20px",
    backgroundColor: COLORS.headerBg,
    color: "#fff",
    borderRadius: 12,
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
  } as const,
  summaryLabel: {
    fontSize: 12,
    letterSpacing: "0.1em",
    color: "#94a3b8",
    fontWeight: 700,
    minWidth: 48,
  } as const,
  summaryText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#e2e8f0",
    flex: 1,
  } as const,
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 20,
    marginBottom: 24,
  } as const,
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  } as const,
  cardHeader: {
    borderBottom: `1px solid ${COLORS.border}`,
    paddingBottom: 12,
  } as const,
  methodName: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
  } as const,
  methodSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  } as const,
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  } as const,
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: COLORS.muted,
  } as const,
  principle: {
    fontSize: 13,
    lineHeight: 1.6,
    color: COLORS.text,
  } as const,
  metricsTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  } as const,
  metricLabel: {
    padding: "6px 8px 6px 0",
    color: COLORS.muted,
    verticalAlign: "top",
    width: "60%",
  } as const,
  metricValue: {
    padding: "6px 0",
    fontWeight: 600,
    textAlign: "right" as const,
  } as const,
  prosConsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  } as const,
  list: {
    margin: "6px 0 0",
    paddingLeft: 18,
  } as const,
  listItem: {
    fontSize: 12,
    lineHeight: 1.5,
    color: COLORS.text,
    marginBottom: 4,
  } as const,
  verdictBox: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 600,
  } as const,
  conclusionBox: {
    backgroundColor: COLORS.card,
    border: `2px solid ${COLORS.accent}`,
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  } as const,
  conclusionTitle: {
    margin: "0 0 12px",
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.accent,
  } as const,
  conclusionList: {
    margin: 0,
    paddingLeft: 20,
    fontSize: 14,
    lineHeight: 1.8,
  } as const,
  nextSteps: {
    marginTop: 16,
    padding: "12px 16px",
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.6,
  } as const,
  footer: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center" as const,
    padding: "16px 0",
  } as const,
};
