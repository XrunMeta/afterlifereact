

export function consumeSseFinalText(sseText) {
  let full = '';
  let curEvent = null;
  for (const line of String(sseText).split('\n')) {
    if (line.startsWith('event:')) { curEvent = line.slice(6).trim(); continue; }
    if (line.startsWith('data:')) {
      if (curEvent !== 'chunk') continue;
      try {
        const obj = JSON.parse(line.slice(5).trim());
        if (typeof obj.text === 'string') full += obj.text;
      } catch {  }
    }
  }
  return full;
}

export async function runChatRelay(deps, { callId, publisherPort, personaSlug, personaBundle = null, history, text }) {
  const sse = await deps.fetchChat({
    message: text,
    callId,
    publisherPort,
    persona_slug: personaSlug,
    personaBundle,   
    history,
    source: 'rn-call',
    speaker_role: 'visitor',
  });
  const finalText = consumeSseFinalText(sse);

  try {
    await deps.postTurnCallback(callId, { role: 'clone', text: finalText });
  } catch (e) {
    console.warn('[sp2/relay] turn callback failed', callId, e?.message ?? e);
  }
  return finalText;
}
