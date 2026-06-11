

export interface PrebuildArgs {
  base: string;          
  secret: string;        
  cloneId: string;
  voiceRawUrl: string | null;
}

export async function triggerPrebuild(
  fetchImpl: typeof fetch,
  args: PrebuildArgs,
): Promise<void> {
  if (!args.voiceRawUrl) return; 
  try {
    await fetchImpl(`${args.base}/prethird/prebuild`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${args.secret}`,
      },
      body: JSON.stringify({ cloneId: args.cloneId, voiceRawUrl: args.voiceRawUrl }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {

  }
}
