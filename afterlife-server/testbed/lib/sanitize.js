

const v_a51c5c =
  /[\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}\u{20E3}]/gu;

const v_1d64c1 = /[♥♡♪♫♬★☆※→←↑↓⇒⇐•·]/g;

export function v_0f0580(v_9b6134) {
  if (typeof v_9b6134 !== 'string' || !v_9b6134) return '';
  return v_9b6134
    .replace(v_a51c5c, '')
    .replace(v_1d64c1, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function v_c80dec(v_9b6134) {
  if (typeof v_9b6134 !== 'string' || !v_9b6134) return '';
  return v_9b6134.replace(v_a51c5c, '').replace(v_1d64c1, '');
}
