

const QUESTION_ENDING_RE =
  /(까|까요|니|냐|나요|가요|는가|은가|을까|을까요|ㄹ까요|을래|을래요|는지|건가|던가|맞지|맞죠|인가요|인가)$/;

const TERMINAL_PUNCT_RE = /[?!.]$/;

export function ensureQuestionMark(text: string): string {
  const trimmed = text.trim();
  if (trimmed === '') return trimmed;
  if (TERMINAL_PUNCT_RE.test(trimmed)) return trimmed;
  if (QUESTION_ENDING_RE.test(trimmed)) return `${trimmed}?`;
  return trimmed;
}
