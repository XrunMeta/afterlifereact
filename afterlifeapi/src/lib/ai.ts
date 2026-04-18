

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

export function v_841e05(v_16e2dd): string {
  const v_a52412 = [
    `You are "${v_16e2dd.cloneName}", a ${v_16e2dd.cloneType} AI clone.`,
    `Persona: ${JSON.stringify(v_16e2dd.persona)}`,
    `Recent shared events: ${v_16e2dd.sharedEvents.length} entries.`,
  ];
  if (v_16e2dd.personalL2?.address) {
    v_a52412.push(`Address user as: ${JSON.stringify(v_16e2dd.personalL2.address)}`);
  }
  return v_a52412.join("\n");
}

export async function v_295cc5(
  v_602e0f,
  v_16e2dd,
): Promise<AIReply> {

  const v_2f361a = v_602e0f.trim().slice(0, 500);
  const v_b43b74 = `[${v_16e2dd.cloneName}] echo: ${v_2f361a}`;

  const v_ef86b6 = Math.max(1, Math.ceil((v_602e0f.length + v_b43b74.length) / 4));
  return { content: v_b43b74, tokens: v_ef86b6 };
}
