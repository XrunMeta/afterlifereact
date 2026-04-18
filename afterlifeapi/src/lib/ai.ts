

export interface AIContext {
  cloneName: string;
  cloneType: string;
  persona: Record<string, unknown>;
  sharedEvents: unknown[];
  personalL2: Record<string, unknown> | null;
}

export interface AIReply {
  content: string;
  tokens: number;
}

export function buildSystemPrompt(ctx: AIContext): string {
  const lines = [
    `You are "${ctx.cloneName}", a ${ctx.cloneType} AI clone.`,
    `Persona: ${JSON.stringify(ctx.persona)}`,
    `Recent shared events: ${ctx.sharedEvents.length} entries.`,
  ];
  if (ctx.personalL2?.address) {
    lines.push(`Address user as: ${JSON.stringify(ctx.personalL2.address)}`);
  }
  return lines.join("\n");
}

export async function callMockAI(
  userText: string,
  ctx: AIContext,
): Promise<AIReply> {

  const trimmed = userText.trim().slice(0, 500);
  const content = `[${ctx.cloneName}] echo: ${trimmed}`;

  const tokens = Math.max(1, Math.ceil((userText.length + content.length) / 4));
  return { content, tokens };
}
