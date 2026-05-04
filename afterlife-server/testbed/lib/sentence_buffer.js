

const MIN_LEN = 4;
const FORCE_FLUSH = 30;

const SENTENCE_RE = /([^.!?。…,、\n]+[.!?。…,、]+["')\]」』]?)/u;

export function createSentenceBuffer({ minLen = MIN_LEN, forceFlush = FORCE_FLUSH } = {}) {
  let buf = '';
  return {
    feed(chunk) {
      if (typeof chunk !== 'string' || !chunk) return [];
      buf += chunk;
      const out = [];

      while (true) {
        const m = buf.match(SENTENCE_RE);
        if (!m) break;
        const sentence = m[1].trim();
        if (sentence.length >= minLen) {
          out.push(sentence);
          buf = buf.slice(m.index + m[0].length);
        } else {

          break;
        }
      }

      if (buf.length >= forceFlush) {
        const cutComma = buf.lastIndexOf(',', forceFlush);
        const cutSpace = buf.lastIndexOf(' ', forceFlush);
        const cut = Math.max(cutComma, cutSpace);
        if (cut > minLen) {
          const piece = buf.slice(0, cut + 1).trim();
          if (piece) out.push(piece);
          buf = buf.slice(cut + 1);
        } else {

          const piece = buf.slice(0, forceFlush).trim();
          if (piece) out.push(piece);
          buf = buf.slice(forceFlush);
        }
      }

      return out;
    },
    flush() {
      const remaining = buf.trim();
      buf = '';
      return remaining ? [remaining] : [];
    },
    peek() {
      return buf;
    },
    reset() {
      buf = '';
    },
  };
}
