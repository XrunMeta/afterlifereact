
(function () {
  const v_e792be = document.getElementById('monToggleBtn');
  const v_62349c = document.getElementById('monCloseBtn');
  const v_a5975a = document.getElementById('monPanel');
  const v_d3a434 = document.getElementById('monRows');
  const v_53c44a = document.getElementById('monMeta');
  if (!v_e792be || !v_a5975a || !v_d3a434) return;

  let v_cb36b1 = null;
  let v_9b7cdd = 0;
  const v_110a8b = new Set();

  const v_2456e2 = (v_fd5f43) =>
    String(v_fd5f43 ?? '').replace(/[&<>]/g, (v_3f4e2e) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[v_3f4e2e]));
  const v_e76aeb = (v_fd5f43, v_f4e98d) => {
    const v_8d41d7 = String(v_fd5f43 ?? '');
    return v_8d41d7.length > v_f4e98d ? v_8d41d7.slice(0, v_f4e98d) + '…' : v_8d41d7;
  };
  const v_d799e2 = (v_81e2ef) => (v_81e2ef == null ? '·' : v_81e2ef);
  const v_3405d6 = (v_6fc191) => {
    try { return new Date(v_6fc191).toLocaleTimeString('ko-KR', { hour12: false }); }
    catch { return v_6fc191 ?? ''; }
  };

  function v_8719dd(v_8d41d7) {
    return (
      `<tr data-id="${v_8d41d7.id}" class="mon-row">` +
      `<td>${v_8d41d7.id}</td>` +
      `<td>${v_3405d6(v_8d41d7.created_at)}</td>` +
      `<td>${v_2456e2(v_8d41d7.mode ?? '')}</td>` +
      `<td title="${v_2456e2(v_8d41d7.user_text)}">${v_2456e2(v_e76aeb(v_8d41d7.user_text, 14))}</td>` +
      `<td title="${v_2456e2(v_8d41d7.llm_text)}">${v_2456e2(v_e76aeb(v_8d41d7.llm_text, 18))}</td>` +
      `<td>${v_d799e2(v_8d41d7.llm_first_token_ms)}/${v_d799e2(v_8d41d7.llm_total_ms)}</td>` +
      `<td>${v_d799e2(v_8d41d7.tts_total_ms)}/${v_d799e2(v_8d41d7.tts_count)}</td>` +
      `<td>${v_d799e2(v_8d41d7.mt_whisper_ms)}</td>` +
      `<td>${v_d799e2(v_8d41d7.mt_coord_ms)}</td>` +
      `<td>${v_d799e2(v_8d41d7.mt_vae_ms)}</td>` +
      `<td>${v_d799e2(v_8d41d7.mt_unet_ms)}</td>` +
      `<td>${v_d799e2(v_8d41d7.mt_ffmpeg_ms)}</td>` +
      `<td>${v_d799e2(v_8d41d7.mt_infer_ms)}</td>` +
      `<td>${v_d799e2(v_8d41d7.e2e_ms)}</td>` +
      `</tr>`
    );
  }

  async function v_16badd() {
    try {
      const v_cb35cb = await fetch(`/oth-path?limit=50&since=${v_9b7cdd}`, { cache: 'no-store' });
      if (!v_cb35cb.ok) return;
      const { turns: v_3035d9 } = await v_cb35cb.json();
      if (!Array.isArray(v_3035d9) || v_3035d9.length === 0) return;

      const v_3871e2 = v_3035d9.filter((v_8d41d7) => !v_110a8b.has(v_8d41d7.id)).sort((v_779914, v_148ff6) => v_779914.id - v_148ff6.id);
      for (const v_8d41d7 of v_3871e2) {
        v_110a8b.add(v_8d41d7.id);
        if (v_8d41d7.id > v_9b7cdd) v_9b7cdd = v_8d41d7.id;
        v_d3a434.insertAdjacentHTML('afterbegin', v_8719dd(v_8d41d7));
      }
      v_53c44a.textContent = `${v_110a8b.size} turns`;

      while (v_d3a434.children.length > 200) v_d3a434.removeChild(v_d3a434.lastChild);
    } catch {  }
  }

  function v_207c31() {
    v_a5975a.hidden = false;
    v_e792be.setAttribute('aria-pressed', 'true');
    v_16badd();
    v_cb36b1 = setInterval(v_16badd, 1500);
  }
  function v_c78a36() {
    v_a5975a.hidden = true;
    v_e792be.setAttribute('aria-pressed', 'false');
    if (v_cb36b1) { clearInterval(v_cb36b1); v_cb36b1 = null; }
  }

  v_e792be.addEventListener('click', () => (v_a5975a.hidden ? v_207c31() : v_c78a36()));
  if (v_62349c) v_62349c.addEventListener('click', v_c78a36);

  v_d3a434.addEventListener('click', async (v_9e86fd) => {
    const v_bee4c1 = v_9e86fd.target.closest('.mon-row');
    if (!v_bee4c1) return;
    const v_a448ad = v_bee4c1.nextElementSibling;
    if (v_a448ad && v_a448ad.classList.contains('mon-detail')) { v_a448ad.remove(); return; }
    try {
      const v_cb35cb = await fetch(`/oth-path${v_bee4c1.dataset.id}`, { cache: 'no-store' });
      if (!v_cb35cb.ok) return;
      const v_e13cd0 = await v_cb35cb.json();
      const v_7d5f12 = document.createElement('tr');
      v_7d5f12.className = 'mon-detail';
      v_7d5f12.innerHTML = `<td colspan="14"><pre>${v_2456e2(v_e13cd0.raw_json ?? '{}')}</pre></td>`;
      v_bee4c1.after(v_7d5f12);
    } catch {}
  });
})();
