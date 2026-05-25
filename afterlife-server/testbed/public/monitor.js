
(function () {
  const toggleBtn = document.getElementById('monToggleBtn');
  const closeBtn = document.getElementById('monCloseBtn');
  const panel = document.getElementById('monPanel');
  const rowsEl = document.getElementById('monRows');
  const metaEl = document.getElementById('monMeta');
  if (!toggleBtn || !panel || !rowsEl) return;

  let timer = null;
  let lastSeenId = 0;
  const seen = new Set();

  const esc = (s) =>
    String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const clip = (s, n) => {
    const t = String(s ?? '');
    return t.length > n ? t.slice(0, n) + '…' : t;
  };
  const ms = (v) => (v == null ? '·' : v);
  const hhmmss = (iso) => {
    try { return new Date(iso).toLocaleTimeString('ko-KR', { hour12: false }); }
    catch { return iso ?? ''; }
  };

  function rowHtml(t) {
    return (
      `<tr data-id="${t.id}" class="mon-row">` +
      `<td>${t.id}</td>` +
      `<td>${hhmmss(t.created_at)}</td>` +
      `<td>${esc(t.mode ?? '')}</td>` +
      `<td title="${esc(t.user_text)}">${esc(clip(t.user_text, 14))}</td>` +
      `<td title="${esc(t.llm_text)}">${esc(clip(t.llm_text, 18))}</td>` +
      `<td>${ms(t.llm_first_token_ms)}/${ms(t.llm_total_ms)}</td>` +
      `<td>${ms(t.tts_total_ms)}/${ms(t.tts_count)}</td>` +
      `<td>${ms(t.mt_whisper_ms)}</td>` +
      `<td>${ms(t.mt_coord_ms)}</td>` +
      `<td>${ms(t.mt_vae_ms)}</td>` +
      `<td>${ms(t.mt_unet_ms)}</td>` +
      `<td>${ms(t.mt_ffmpeg_ms)}</td>` +
      `<td>${ms(t.mt_infer_ms)}</td>` +
      `<td>${ms(t.e2e_ms)}</td>` +
      `</tr>`
    );
  }

  const kvRowsEl = document.getElementById('kvRows');
  const kvMeta = document.getElementById('kvMeta');
  const kvLevelFilter = document.getElementById('kvLevelFilter');
  const kvUserFilter = document.getElementById('kvUserFilter');
  let kvPrev = new Map(); 

  function kvRowHtml(a, fresh) {
    return (
      `<tr data-kvid="${a.id}" class="kv-row${fresh ? ' kv-fresh' : ''}">` +
      `<td>${esc(a.category)}</td><td>${esc(a.key)}</td>` +
      `<td title="${esc(a.value)}">${esc(clip(a.value, 24))}</td>` +
      `<td>${esc(a.level)}</td><td>${esc(a.user_label ?? '·')}</td>` +
      `<td>${a.confidence ?? '·'}</td><td>${esc(String(a.updated_at ?? '').slice(5, 19))}</td>` +
      `</tr>`
    );
  }

  async function pollKv() {
    try {
      const lvl = kvLevelFilter?.value ?? '';
      const usr = (kvUserFilter?.value ?? '').trim();
      const qs = new URLSearchParams({ persona: 'halbae' });
      if (lvl) qs.set('level', lvl);
      if (usr) qs.set('user', usr);
      const r = await fetch(`/oth-path?${qs}`, { cache: 'no-store' });
      if (!r.ok) return;
      const { kv } = await r.json();
      if (!Array.isArray(kv)) return;
      kvRowsEl.innerHTML = kv.map((a) => kvRowHtml(a, kvPrev.get(a.id) !== a.updated_at)).join('');
      kvMeta.textContent = `${kv.length} attrs`;
      kvPrev = new Map(kv.map((a) => [a.id, a.updated_at]));
    } catch {}
  }

  async function poll() {
    try {
      const r = await fetch(`/oth-path?limit=50&since=${lastSeenId}`, { cache: 'no-store' });
      if (!r.ok) return;
      const { turns } = await r.json();
      if (!Array.isArray(turns) || turns.length === 0) return;

      const fresh = turns.filter((t) => !seen.has(t.id)).sort((a, b) => a.id - b.id);
      for (const t of fresh) {
        seen.add(t.id);
        if (t.id > lastSeenId) lastSeenId = t.id;
        rowsEl.insertAdjacentHTML('afterbegin', rowHtml(t));
      }
      metaEl.textContent = `${seen.size} turns`;

      while (rowsEl.children.length > 200) rowsEl.removeChild(rowsEl.lastChild);
    } catch {  }
  }

  function open() {
    panel.hidden = false;
    document.body.classList.add('mon-open'); 
    toggleBtn.setAttribute('aria-pressed', 'true');
    poll(); pollKv();
    timer = setInterval(() => { poll(); pollKv(); }, 1500);
  }
  function close() {
    panel.hidden = true;
    document.body.classList.remove('mon-open');
    toggleBtn.setAttribute('aria-pressed', 'false');
    if (timer) { clearInterval(timer); timer = null; }
  }

  toggleBtn.addEventListener('click', () => (panel.hidden ? open() : close()));
  if (closeBtn) closeBtn.addEventListener('click', close);

  rowsEl.addEventListener('click', async (e) => {
    const tr = e.target.closest('.mon-row');
    if (!tr) return;
    const next = tr.nextElementSibling;
    if (next && next.classList.contains('mon-detail')) { next.remove(); return; }
    try {
      const r = await fetch(`/oth-path${tr.dataset.id}`, { cache: 'no-store' });
      if (!r.ok) return;
      const full = await r.json();
      const det = document.createElement('tr');
      det.className = 'mon-detail';
      det.innerHTML = `<td colspan="14"><pre>${esc(full.raw_json ?? '{}')}</pre></td>`;
      tr.after(det);
    } catch {}
  });

  if (kvRowsEl) kvRowsEl.addEventListener('click', async (e) => {
    const tr = e.target.closest('.kv-row');
    if (!tr) return;
    const next = tr.nextElementSibling;
    if (next && next.classList.contains('kv-detail')) { next.remove(); return; }
    try {
      const r = await fetch(`/oth-path${tr.dataset.kvid}/history`, { cache: 'no-store' });
      if (!r.ok) return;
      const { history } = await r.json();
      const det = document.createElement('tr');
      det.className = 'kv-detail';
      const lines = (history ?? []).map((h) => `${h.op} ${esc(h.old_value ?? '')}→${esc(h.new_value ?? '')} (${esc(h.reason ?? '')}) turn#${h.source_turn_id ?? '·'}`).join('<br>');
      det.innerHTML = `<td colspan="7"><pre>${lines || '(이력 없음)'}</pre></td>`;
      tr.after(det);
    } catch {}
  });
  if (kvLevelFilter) kvLevelFilter.addEventListener('change', pollKv);
  if (kvUserFilter) kvUserFilter.addEventListener('input', () => { clearTimeout(kvUserFilter._t); kvUserFilter._t = setTimeout(pollKv, 400); });
})();
