

export function v_472dcb(v_34a0f5) {
  let v_e13cd0 = '';
  let v_e06e7a = null;
  for (const v_e6293e of String(v_34a0f5).split('\n')) {
    if (v_e6293e.startsWith('event:')) { v_e06e7a = v_e6293e.slice(6).trim(); continue; }
    if (v_e6293e.startsWith('data:')) {
      if (v_e06e7a !== 'chunk') continue;
      try {
        const v_8839e3 = JSON.parse(v_e6293e.slice(5).trim());
        if (typeof v_8839e3.text === 'string') v_e13cd0 += v_8839e3.text;
      } catch {  }
    }
  }
  return v_e13cd0;
}

export async function v_3a60ca(v_84b93d, { callId: v_be62d3, publisherPort: v_497c1d, personaSlug: v_47fe3d, personaBundle: v_ba0fde = null, history: v_10740d, text: v_9b6134 }) {
  const v_bb2632 = await v_84b93d.fetchChat({
    message: v_9b6134,
    callId: v_be62d3,
    publisherPort: v_497c1d,
    persona_slug: v_47fe3d,
    personaBundle: v_ba0fde,   
    history: v_10740d,
    source: 'rn-call',
    speaker_role: 'visitor',
  });
  const v_3188ae = v_472dcb(v_bb2632);

  try {
    await v_84b93d.postTurnCallback(v_be62d3, { role: 'clone', text: v_3188ae });
  } catch (v_9e86fd) {
    console.warn('[sp2/relay] turn callback failed', v_be62d3, v_9e86fd?.message ?? v_9e86fd);
  }
  return v_3188ae;
}
