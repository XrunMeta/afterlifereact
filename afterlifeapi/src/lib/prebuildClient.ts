

export interface PrebuildArgs {
  base: string;          
  secret: string;        
  cloneId: string;
  voiceRawUrl: string | null;
}

export async function v_67dc73(
  v_d10060,
  v_4317d1,
): Promise<void> {
  if (!v_4317d1.voiceRawUrl) return; 
  try {
    await v_d10060(`${v_4317d1.base}/prethird/prebuild`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${v_4317d1.secret}`,
      },
      body: JSON.stringify({ cloneId: v_4317d1.cloneId, voiceRawUrl: v_4317d1.voiceRawUrl }),
    });
  } catch {

  }
}
