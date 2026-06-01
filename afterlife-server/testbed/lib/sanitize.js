

const EMOJI_RE =
  /[\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}\u{20E3}]/gu;

const EXTRA_SYMBOL_RE = /[♥♡♪♫♬★☆※→←↑↓⇒⇐•·]/g;

export function stripEmoji(text) {
  if (typeof text !== 'string' || !text) return '';
  return text
    .replace(EMOJI_RE, '')
    .replace(EXTRA_SYMBOL_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeChunk(text) {
  if (typeof text !== 'string' || !text) return '';
  return text.replace(EMOJI_RE, '').replace(EXTRA_SYMBOL_RE, '');
}

export function applyBlocklist(text, blocklist) {
  if (typeof text !== 'string' || !text) return text ?? '';
  if (!Array.isArray(blocklist) || blocklist.length === 0) return text;
  let out = text;
  for (const raw of blocklist) {
    if (typeof raw !== 'string' || !raw) continue;
    const esc = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(esc, 'gi'), '⋯');
  }
  return out;
}
