

export const MIN_MESSAGE_CREDIT_COST = 1;
export const TOKENS_PER_CREDIT = 100;
export const CHARS_PER_TOKEN_ESTIMATE = 3.5; 

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

export function estimateMessageCost(args: {
  userText: string;
  replyText?: string;

  actualTokens?: number;
}): { credits: number; tokens: number } {
  const tokens =
    args.actualTokens ??
    estimateTokens(args.userText) + estimateTokens(args.replyText ?? "");
  const credits = Math.max(MIN_MESSAGE_CREDIT_COST, Math.ceil(tokens / TOKENS_PER_CREDIT));
  return { credits, tokens };
}
