

export const v_27c916 = [
  {
    name: 'bridge_generic',
    kind: 'bridge',
    durationSec: 5,
    model: 'kling-3.0',
    sayText: '응! 잘 듣고 있어! 쫌만 더 생각해서 바로 말해줄게.',
    motionPrompt:
      'front-facing, gently nodding while smiling warmly, natural talking mouth movement matching the Korean line, subtle head sway',
    startEndConstraint:
      'first and last frame must be the base persona neutral resting pose (mouth closed, eyes open, facing camera, no head tilt) so it can seamlessly stitch before/after an idle loop',
    loop: false,
  },
  {
    name: 'idle_breath',
    kind: 'idle',
    durationSec: 4,
    model: 'kling-3.0',
    sayText: '',
    motionPrompt:
      'silent idle, gentle breathing, subtle weight shift, one or two natural eye blinks, no mouth movement',
    startEndConstraint:
      'first and last frame identical (neutral resting pose · mouth closed, eyes open, facing camera) for seamless infinite loop',
    loop: true,
  },
];

export async function v_fa636c({ faceImageUrl: v_910738, spec: v_2750f3, apiKey: v_c367b4 }) {
  if (!v_c367b4) {
    throw new Error(
      'HIGGSFIELD_API_KEY 미설정 — 토큰 구매/발급 후 systemd drop-in 에 주입 필요 ' +
        `(spec=${v_2750f3.name} face=${v_910738?.slice(0, 60)}...)`,
    );
  }

  throw new Error(
    'higgsfieldRender not implemented — Higgsfield API endpoint/auth 확정 후 배선. ' +
      'MCP: https://mcp.higgsfield.ai/mcp (조직 커넥터 등록 완료).',
  );
}

export async function v_a8cf08({ cloneId: v_6e0fd3, faceImageUrl: v_910738, apiKey: v_c367b4 }) {

  const v_a7f568 = [];
  for (const v_2750f3 of v_27c916) {
    const v_1ff1ff = await v_fa636c({ faceImageUrl: v_910738, spec: v_2750f3, apiKey: v_c367b4 });
    v_a7f568.push({ spec: v_2750f3, mp4: v_1ff1ff });
  }
  return v_a7f568;
}
