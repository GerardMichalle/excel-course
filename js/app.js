(function () {
  const C = window.COURSE;
  const XL = window.XL;
  const Store = window.Store;
  const TABLES = Object.values(C.tables);

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ICON = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3.5 5 5.2 5 10a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2.3-5 .2 1.6.9 2.6 2 3.2C11 8.6 11.3 5.6 12 3z" fill="currentColor"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L5 13.5h6L10 22l9-12h-6.2L13 2z" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    flask: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 3h5M10.5 3v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4A1.5 1.5 0 0 0 19 19l-5.5-10V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7.5 15h9" stroke="currentColor" stroke-width="2"/></svg>',
    award: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 14l-1.5 7 5-2.5 5 2.5-1.5-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-6.5 8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.4c-.7.3-1 .8-1 1.5v.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="currentColor"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 20.5c.8-3.8 3.9-5.8 7.5-5.8s6.7 2 7.5 5.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };

  // Índices del curso
  const BLOCKS = C.blocks.slice().sort((a, b) => +a.id.slice(1) - +b.id.slice(1));
  BLOCKS.forEach((b, i) => { b.n = i; });
  const LESSONS = [];
  const EX = new Map();
  BLOCKS.forEach((b) => b.lessons.forEach((l, li) => {
    l.block = b; l.li = li; LESSONS.push(l);
    (l.exercises || []).forEach((e, i) => {
      e.lesson = l; e.n = i + 1; e.type = e.type || 'formula';
      const f = e.type === 'formula' ? e.sol : e.type === 'value' ? e.verify : null;
      if (f) { const r = XL.evaluate(f, TABLES); e.expected = r.ok ? r.value : null; }
      EX.set(e.id, e);
    });
  }));

  const XP = { formula: 25, value: 25, choice: 15, solUsed: 8, choiceRetry: 5, doit: 5, lesson: 20, quiz: 100, block: 200 };
  const LEVELS = [
    { name: 'Aprendiz', need: 0 },
    { name: 'Intermedio', need: 2 },
    { name: 'Avanzado', need: 6 },
    { name: 'Avanzado+', need: 9 },
    { name: 'Experto', need: BLOCKS.length },
  ];

  // Progreso
  const S = () => Store.get();
  const exDone = (e) => !!S().ex[e.id];
  const doitKey = (l, i) => l.id + '#' + i;
  const doitDone = (l, i) => !!S().doit[doitKey(l, i)];
  function lessonParts(l) {
    let total = 0, done = 0;
    for (const e of l.exercises || []) { total++; if (exDone(e)) done++; }
    if (l.requireDoit) (l.doit || []).forEach((_, i) => { total++; if (doitDone(l, i)) done++; });
    return { total, done };
  }
  const lessonDone = (l) => { const p = lessonParts(l); return p.total > 0 && p.done === p.total; };
  const quizPassed = (b) => (S().quiz[b.id] || 0) >= 0.8;
  const blockDone = (b) => b.lessons.every(lessonDone) && quizPassed(b);
  const blockUnlocked = (b) => S().free || b.n <= 1 || blockDone(BLOCKS[b.n - 1]);
  function blockPct(b) {
    let t = 0, d = 0;
    b.lessons.forEach((l) => { const p = lessonParts(l); t += p.total; d += p.done; });
    t += 3; if (quizPassed(b)) d += 3;
    return t ? d / t : 0;
  }
  const blocksDoneCount = () => BLOCKS.filter(blockDone).length;
  function levelInfo() {
    const n = blocksDoneCount();
    let i = 0;
    LEVELS.forEach((lv, k) => { if (n >= lv.need) i = k; });
    const cur = LEVELS[i], next = LEVELS[i + 1];
    const pct = next ? (n - cur.need) / (next.need - cur.need) : 1;
    return { cur, next, pct, n };
  }
  function totalXP() {
    const s = S();
    let xp = 0;
    for (const [id, v] of Object.entries(s.ex)) {
      const e = EX.get(id); if (!e) continue;
      if (e.type === 'choice') xp += v === 'full' ? XP.choice : XP.choiceRetry;
      else xp += v === 'full' ? XP[e.type] : XP.solUsed;
    }
    xp += Object.keys(s.doit).length * XP.doit;
    xp += LESSONS.filter(lessonDone).length * XP.lesson;
    xp += BLOCKS.filter(quizPassed).length * XP.quiz;
    xp += BLOCKS.filter(blockDone).length * XP.block;
    return xp;
  }
  function nextLesson() {
    const last = LESSONS.find((l) => l.id === S().last);
    if (last && !lessonDone(last) && blockUnlocked(last.block)) return last;
    for (const b of BLOCKS) {
      if (!blockUnlocked(b)) break;
      const l = b.lessons.find((x) => !lessonDone(x));
      if (l) return l;
      if (!quizPassed(b)) return { quizOf: b };
    }
    return null;
  }

  // Celebraciones
  function snapshot() {
    return {
      lessons: new Set(LESSONS.filter(lessonDone).map((l) => l.id)),
      blocks: new Set(BLOCKS.filter(blockDone).map((b) => b.id)),
      level: levelInfo().cur.name,
    };
  }
  function celebrateDiff(before) {
    const after = snapshot();
    const newBlocks = [...after.blocks].filter((x) => !before.blocks.has(x) && !S().done['block:' + x]);
    const newLessons = [...after.lessons].filter((x) => !before.lessons.has(x) && !S().done['lesson:' + x]);
    const levelUp = after.level !== before.level && !S().done['level:' + after.level];
    if (!newBlocks.length && !newLessons.length && !levelUp) return;
    Store.update((s) => {
      newBlocks.forEach((x) => { s.done['block:' + x] = Date.now(); });
      newLessons.forEach((x) => { s.done['lesson:' + x] = Date.now(); });
      if (levelUp) s.done['level:' + after.level] = Date.now();
    });
    if (newBlocks.length) {
      const b = BLOCKS.find((x) => x.id === newBlocks[0]);
      const next = BLOCKS[b.n + 1];
      confetti(220);
      if (b.final) {
        modal(`<div class="modal-badge gold">${ICON.award}</div><h2>¡Eres Experto en Excel!</h2><p>Terminaste toda la ruta, del repaso hasta VBA y el proyecto final. Tu certificado está listo.</p>`,
          [{ label: 'Ver mi certificado', primary: true, go: '#certificado' }]);
      } else {
        modal(`<div class="modal-badge">${ICON.check}</div><p class="eyebrow">Bloque ${b.n} completado · +${XP.block} XP</p><h2>${esc(b.title)}</h2>
          <p>${levelUp ? 'Además subiste a nivel <b>' + esc(after.level) + '</b>. ' : ''}${next ? 'Se desbloqueó el <b>Bloque ' + next.n + ': ' + esc(next.title) + '</b>.' : ''}</p>`,
          next ? [{ label: 'Empezar Bloque ' + next.n, primary: true, go: '#' + next.lessons[0].id }, { label: 'Ver la ruta', go: '#inicio' }] : [{ label: 'Ver la ruta', primary: true, go: '#inicio' }]);
      }
      return;
    }
    if (levelUp) {
      confetti(160);
      modal(`<div class="modal-badge">${ICON.bolt}</div><p class="eyebrow">Nuevo nivel</p><h2>${esc(after.level)}</h2><p>Sigue así. Cada bloque te acerca al nivel Experto.</p>`, [{ label: 'Seguir', primary: true }]);
      return;
    }
    if (newLessons.length) {
      const l = LESSONS.find((x) => x.id === newLessons[0]);
      confetti(70);
      toast(`<b>Lección completada</b> · ${esc(l.title)} <span class="xp">+${XP.lesson} XP</span>`, 'big');
      const nb = $('#lesson-next-cta');
      if (nb) nb.classList.add('pulse');
    }
  }

  // UI: toasts, modal, confetti
  function toast(html, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  function modal(html, actions) {
    const m = $('#modal');
    m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}<div class="modal-actions"></div></div>`;
    const box = $('.modal-actions', m);
    (actions || [{ label: 'Cerrar', primary: true }]).forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (a.primary ? 'primary' : 'ghost');
      btn.textContent = a.label;
      btn.addEventListener('click', () => { m.hidden = true; if (a.go) location.hash = a.go; });
      box.appendChild(btn);
    });
    m.hidden = false;
    const first = $('button', box); if (first) first.focus();
  }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') e.currentTarget.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#modal').hidden = true; });

  const cv = $('#confetti');
  const cx = cv.getContext('2d');
  let parts = [], raf = null;
  function confetti(n) {
    if (reduceMotion) return;
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
    const cs = getComputedStyle(document.documentElement);
    const colors = ['--accent', '--xp', '--c3', '--c4'].map((v) => cs.getPropertyValue(v).trim() || '#3a8');
    for (let i = 0; i < n; i++) {
      parts.push({
        x: innerWidth * (0.2 + Math.random() * 0.6), y: innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
        r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4,
        c: colors[i % colors.length], life: 0,
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach((p) => {
      p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; p.life++;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c;
      cx.fillRect(-p.r, -p.r / 2.5, p.r * 2, p.r / 1.25); cx.restore();
    });
    parts = parts.filter((p) => p.y < innerHeight + 40 && p.life < 260);
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = null; cx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      if (btn) { const o = btn.innerHTML; btn.innerHTML = ICON.check + ' Copiado'; setTimeout(() => { btn.innerHTML = o; }, 1600); }
      toast('Copiado. Pégalo en Excel con <kbd>Ctrl</kbd>+<kbd>V</kbd>.');
    } catch (e) {
      modal(`<h2>Copia manual</h2><p>Tu navegador no dejó copiar automáticamente. Selecciona el texto y usa <kbd>Ctrl</kbd>+<kbd>C</kbd>.</p><textarea class="copy-area" id="copy-fallback" readonly>${esc(text)}</textarea>`);
      const ta = $('#copy-fallback'); ta.focus(); ta.select();
    }
  }
  function copySpecText(spec) {
    if (!spec.dup) return C.toTSV(spec.table, spec.cols);
    const lines = C.toTSV(spec.table, spec.cols).split('\n');
    const rows = lines.slice(1);
    const extra = spec.dup.map((i) => rows[i]);
    return [lines[0], ...rows, ...extra].join('\n');
  }

  // Formato de celdas
  const colLetter = (i) => String.fromCharCode(65 + i);
  function fmtCell(v, t, col) {
    if (v === null || v === undefined) return '<span class="cell-empty"></span>';
    if (t && (t.dateCols || []).includes(col) && typeof v === 'number') {
      const d = XL.fromSerial(v);
      return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear();
    }
    if (t && (t.pctCols || []).includes(col) && typeof v === 'number') return XL.fmtNum(Math.round(v * 10000) / 100) + '%';
    if (typeof v === 'number') return esc(XL.fmtNum(v));
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (XL.isE(v)) return '<span class="cell-err">' + esc(v.code) + '</span>';
    // Espacios visibles para enseñar limpieza
    const s = String(v);
    return esc(s).replace(/^ +| +$| {2,}/g, (m) => '<span class="ws" title="espacio">' + '·'.repeat(m.length) + '</span>');
  }
  const isNumLike = (v) => typeof v === 'number';

  function tableHTML(t, mask) {
    const head = t.columns.map((c, j) => `<th data-ref="${esc(t.name)}[${esc(c)}]" title="Insertar ${esc(t.name)}[${esc(c)}]"><span class="col-l">${colLetter(j)}</span><span class="col-n">${esc(c)}</span></th>`).join('');
    const body = t.rows.map((r, i) => `<tr class="${mask && mask[i] ? 'hit' : ''}"><td class="rn">${i + 2}</td>${r.map((v, j) => `<td class="${isNumLike(v) && !(t.dateCols || []).includes(t.columns[j]) ? 'num' : ''}">${fmtCell(v, t, t.columns[j])}</td>`).join('')}</tr>`).join('');
    return `<div class="grid-wrap"><table class="grid"><thead><tr><th class="rn corner">1</th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  // Panel de datos con pestañas
  let activeInput = null;
  function dataPanel(names, title) {
    const el = document.createElement('div');
    el.className = 'data-panel';
    let cur = names[0];
    const masks = {};
    function render() {
      const t = C.tables[cur];
      el.innerHTML = `<div class="data-head"><div class="data-title"><span class="sheet-dot"></span>${esc(title || 'Datos del simulador')}</div>
        <div class="tabs" role="tablist">${names.map((n) => `<button role="tab" class="tab ${n === cur ? 'on' : ''}" data-tab="${esc(n)}" aria-selected="${n === cur}">${esc(n)}</button>`).join('')}</div></div>
        ${tableHTML(t, masks[cur])}
        <p class="data-foot">Toca un encabezado para insertar la columna en la fórmula. Los <span class="ws">·</span> son espacios de más.</p>`;
    }
    el.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) { cur = tab.dataset.tab; render(); return; }
      const th = e.target.closest('th[data-ref]');
      if (th) insertAtCursor(th.dataset.ref);
    });
    render();
    el.highlight = (tableName, mask) => {
      Object.keys(masks).forEach((k) => delete masks[k]);
      if (tableName && mask && C.tables[tableName] && C.tables[tableName].rows.length === mask.length) {
        masks[tableName] = mask;
        if (names.includes(tableName)) cur = tableName;
      }
      render();
    };
    return el;
  }
  function insertAtCursor(text) {
    const inp = activeInput && document.body.contains(activeInput) ? activeInput : $('.finput');
    if (!inp) return;
    const s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? inp.value.length;
    let v = inp.value;
    if (!v) v = '=';
    const start = inp.value ? s : 1, end = inp.value ? e : 1;
    inp.value = v.slice(0, start) + text + v.slice(end);
    const pos = start + text.length;
    inp.focus(); inp.setSelectionRange(pos, pos);
    inp.dispatchEvent(new Event('input'));
  }

  // Resultado de fórmula
  function resultHTML(r) {
    if (!r.ok) {
      return `<div class="res err"><span class="res-code">${esc(r.error.code || 'Ojo')}</span><span>${esc(r.error.msg || '')}</span></div>`;
    }
    const v = r.value;
    if (XL.isM(v)) {
      const rows = [];
      for (let i = 0; i < v.r; i++) rows.push('<tr>' + v.rowAt(i).map((x) => `<td class="${typeof x === 'number' ? 'num' : ''}">${fmtCell(x)}</td>`).join('') + '</tr>');
      return `<div class="res spill"><div class="res-label">Se derrama en ${v.r} ${v.r === 1 ? 'fila' : 'filas'} × ${v.c} ${v.c === 1 ? 'columna' : 'columnas'}</div><div class="grid-wrap"><table class="grid mini"><tbody>${rows.join('')}</tbody></table></div></div>`;
    }
    const shown = v === '' ? '(vacío)' : XL.display(v);
    return `<div class="res ok"><span class="res-label">Resultado</span><span class="res-val">${esc(shown)}</span></div>`;
  }

  function formulaBar(opts) {
    const wrap = document.createElement('div');
    wrap.className = 'fbar-wrap';
    wrap.innerHTML = `<div class="fbar"><div class="namebox">${esc(opts.name || 'Resultado')}</div><div class="fx" aria-hidden="true">fx</div>
      <input class="finput" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Fórmula" id="${esc(opts.id)}" placeholder="${esc(opts.placeholder || '=')}" value="${esc(opts.value || '')}">
      <button class="run btn primary" type="button">${ICON.play}<span>Evaluar</span></button></div><div class="sig" hidden></div>`;
    const inp = $('.finput', wrap), sig = $('.sig', wrap);
    const updateSig = () => {
      const s = XL.sigAt(inp.value, inp.selectionStart ?? inp.value.length);
      if (!s) { sig.hidden = true; return; }
      const m = s.sig.match(/^([^(]+)\((.*)\)$/);
      const args = m[2].split(/,\s*/);
      sig.innerHTML = `<span class="sig-fn">${esc(m[1])}</span>(${args.map((a, i) => `<span class="${i === Math.min(s.arg, args.length - 1) && !(s.arg >= args.length && !/\.\.\./.test(args[args.length - 1])) ? 'sig-on' : ''}">${esc(a)}</span>`).join(', ')})`;
      sig.hidden = false;
    };
    inp.addEventListener('focus', () => { activeInput = inp; updateSig(); });
    inp.addEventListener('input', updateSig);
    inp.addEventListener('click', updateSig);
    inp.addEventListener('keyup', (e) => { if (e.key.startsWith('Arrow')) updateSig(); });
    inp.addEventListener('blur', () => setTimeout(() => { sig.hidden = true; }, 150));
    const run = () => { sig.hidden = true; opts.onRun(inp.value.trim()); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    $('.run', wrap).addEventListener('click', run);
    wrap.input = inp;
    return wrap;
  }

  // Ejercicios
  function parseUserNumber(s, pct) {
    let t = String(s).trim().replace(/^S\/\s*/i, '').replace(/\s/g, '');
    if (!t) return null;
    const isPct = t.endsWith('%');
    t = t.replace('%', '');
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, '');
    else t = t.replace(',', '.');
    let n = Number(t);
    if (isNaN(n)) return null;
    if (isPct) n /= 100;
    return { n, isPct };
  }

  function coachHint(e, r) {
    const fns = r.ctx.fns;
    const exp = e.expected, v = r.value;
    if (XL.isM(exp) && !XL.isM(v)) return 'Se espera una <b>lista</b> (resultado derramado). Usa la columna completa, por ejemplo <code>tblVentas[Cantidad]</code>, en vez de un solo valor.';
    if (!XL.isM(exp) && XL.isM(v)) return 'Te salió una lista y se espera <b>un solo valor</b>. ¿Te faltó envolverla en SUM, COUNTA o similar?';
    if (XL.isM(exp) && XL.isM(v) && (exp.r !== v.r || exp.c !== v.c)) return 'La lista tiene otro tamaño del esperado (' + exp.r + '×' + exp.c + ').';
    if (v === 0 && (fns.has('SUMIFS') || fns.has('AVERAGEIFS') || fns.has('MAXIFS'))) return 'Da 0. Revisa que el <b>primer argumento</b> sea la columna de números (en SUMIFS va primero) y que los textos del criterio estén bien escritos.';
    if (v === 0 && (fns.has('COUNTIFS') || fns.has('COUNTIF'))) return 'Da 0: ninguna fila cumplió. Revisa el criterio (comillas, operador dentro de comillas, ortografía).';
    if (typeof exp === 'number' && typeof v === 'number' && Math.abs(v - exp) > 0 && exp !== 0 && Math.abs(v / exp - 100) < 1e-6) return 'Está multiplicado por 100: aquí se espera el decimal (el % es solo formato).';
    if (typeof exp === 'string' && typeof v === 'string' && exp.toLowerCase() === v.toLowerCase()) return 'Casi: revisa mayúsculas y minúsculas.';
    return null;
  }

  function exerciseEl(e, panel) {
    const el = document.createElement('div');
    el.className = 'ex';
    el.id = 'ex-' + e.id;
    const xp = e.type === 'choice' ? XP.choice : XP[e.type];
    const kind = { formula: 'Fórmula', value: 'En tu Excel', choice: 'Pregunta' }[e.type];
    el.innerHTML = `<div class="ex-head"><span class="ex-num">${e.n}</span><span class="ex-kind">${kind}</span><span class="ex-xp">${ICON.bolt}${xp} XP</span><span class="ex-state">${ICON.check}Resuelto</span></div>
      <div class="ex-q">${e.q}</div><div class="ex-body"></div><div class="ex-out" aria-live="polite"></div>`;
    const body = $('.ex-body', el), out = $('.ex-out', el);
    const setDone = () => el.classList.toggle('done', exDone(e));
    setDone();

    const award = (full) => {
      if (exDone(e) && S().ex[e.id] === 'full') return;
      const before = snapshot();
      const val = full && !el.dataset.solUsed ? 'full' : (e.type === 'choice' ? 'retry' : 'sol');
      Store.update((s) => { if (!s.ex[e.id] || val === 'full') s.ex[e.id] = val; s.last = e.lesson.id; });
      setDone();
      const pts = e.type === 'choice' ? (val === 'full' ? XP.choice : XP.choiceRetry) : (val === 'full' ? XP[e.type] : XP.solUsed);
      toast(`${ICON.check} <b>${['¡Correcto!', '¡Bien ahí!', '¡Exacto!', '¡Eso es!'][Math.floor(Math.random() * 4)]}</b> <span class="xp">+${pts} XP</span>`, 'ok');
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      celebrateDiff(before);
      updateLessonProgress(e.lesson);
    };

    if (e.type === 'formula') {
      const fb = formulaBar({
        id: 'f-' + e.id, name: 'E' + e.n, placeholder: '=',
        onRun: (f) => {
          const r = XL.evaluate(f, TABLES);
          let msg = '', ok = false;
          if (r.ok) {
            const used = [...(e.must || [])].filter((m) => !r.ctx.fns.has(m));
            const banned = (e.banFns || []).filter((m) => r.ctx.fns.has(m));
            const bannedRefs = (e.ban || []).filter((m) => r.ctx.refs.has(m));
            if (r.ctx.isLiteral) msg = `<div class="fb warn">Escribiste el valor directo. Aquí se trata de que Excel lo calcule con una fórmula.</div>`;
            else if (XL.same(r.value, e.expected)) {
              if (used.length) msg = `<div class="fb warn">El resultado es correcto, pero para este ejercicio usa <b>${used.join(', ')}</b>. Así practicas la función de la lección.</div>`;
              else if (banned.length || bannedRefs.length) msg = `<div class="fb warn">Resultado correcto, pero el reto es hacerlo <b>sin ${[...banned, ...bannedRefs].join(', ')}</b>.</div>`;
              else { ok = true; msg = `<div class="fb good">${ICON.check} Correcto. ${e.lesson.block.n >= 2 ? 'Fórmula sólida.' : 'Así se hace.'}</div>`; }
            } else {
              const hint = coachHint(e, r);
              msg = `<div class="fb bad">No es lo que se pide todavía.${hint ? ' ' + hint : ''}</div>`;
            }
          }
          out.innerHTML = resultHTML(r) + msg;
          if (panel) { const tb = [...r.ctx.tablesUsed][0]; panel.highlight(tb, r.ok ? r.ctx.mask : null); }
          if (ok) award(true);
        },
      });
      body.appendChild(fb);
      const tools = document.createElement('div');
      tools.className = 'ex-tools';
      tools.innerHTML = `${e.hint ? '<button class="btn link" data-hint>Ver pista</button>' : ''}<button class="btn link" data-sol>Ver solución</button>`;
      body.appendChild(tools);
      tools.addEventListener('click', (ev) => {
        if (ev.target.closest('[data-hint]')) { out.innerHTML = `<div class="fb hint"><b>Pista:</b> ${e.hint}</div>`; }
        if (ev.target.closest('[data-sol]')) {
          if (!exDone(e)) el.dataset.solUsed = '1';
          out.innerHTML = `<div class="fb hint"><b>Solución:</b> <code class="sol">${esc(e.sol)}</code><br><span class="muted">Escríbela tú (no la pegues) y evalúa. ${exDone(e) ? '' : 'Al ver la solución el ejercicio vale ' + XP.solUsed + ' XP.'}</span></div>`;
        }
      });
      if (exDone(e)) fb.input.placeholder = 'Ya lo resolviste. Puedes practicar otra vez.';
    } else if (e.type === 'value') {
      body.innerHTML = `<form class="value-form"><label class="sr" for="v-${esc(e.id)}">Tu resultado</label><input id="v-${esc(e.id)}" class="vinput" inputmode="decimal" autocomplete="off" placeholder="Escribe el número que te dio Excel"><button class="btn primary" type="submit">Comprobar</button></form>`;
      $('form', body).addEventListener('submit', (ev) => {
        ev.preventDefault();
        const p = parseUserNumber($('input', body).value, e.pct);
        if (!p) { out.innerHTML = '<div class="fb warn">Escribe un número, por ejemplo 217.5 o 35.25%.</div>'; return; }
        const exp = e.expected;
        const tol = e.tol || 0.011;
        const cands = [p.n];
        if (e.pct && !p.isPct && Math.abs(exp) < 1.5) cands.push(p.n / 100);
        const ok = cands.some((c) => Math.abs(c - exp) <= tol * (e.pct ? 0.01 : 1) || Math.abs(c - exp) <= tol);
        if (ok) { out.innerHTML = `<div class="fb good">${ICON.check} Cuadra con lo esperado. Tu Excel está bien.</div>`; award(true); }
        else out.innerHTML = `<div class="fb bad">No cuadra. Revisa filtros activos, que el campo esté en el área correcta y el tipo de cálculo (Sum, Count, Average).</div>`;
      });
    } else if (e.type === 'choice') {
      body.innerHTML = `<div class="choices">${e.o.map((o, i) => `<button class="choice" data-i="${i}" type="button"><span class="choice-l">${String.fromCharCode(65 + i)}</span><span>${o}</span></button>`).join('')}</div>`;
      let tries = 0;
      body.addEventListener('click', (ev) => {
        const b = ev.target.closest('.choice'); if (!b) return;
        const i = +b.dataset.i;
        tries++;
        if (i === e.a) {
          $$('.choice', body).forEach((x) => { x.disabled = true; });
          b.classList.add('right');
          out.innerHTML = `<div class="fb good">${ICON.check} ${e.why || 'Correcto.'}</div>`;
          if (tries > 1) el.dataset.solUsed = '1';
          award(tries === 1);
        } else {
          b.classList.add('wrong'); b.disabled = true;
          out.innerHTML = `<div class="fb bad">Esa no. Piénsalo otra vez.</div>`;
        }
      });
    }
    return el;
  }

  function updateLessonProgress(l) {
    const p = lessonParts(l);
    const bar = $('#lesson-meter');
    if (bar) {
      bar.style.setProperty('--p', p.total ? p.done / p.total : 0);
      $('#lesson-meter-txt').textContent = p.done + ' de ' + p.total;
    }
    const cta = $('#lesson-status');
    if (cta) cta.innerHTML = lessonDone(l) ? `<span class="pill ok">${ICON.check}Lección completada</span>` : `<span class="pill">${p.total - p.done} pendiente${p.total - p.done === 1 ? '' : 's'}</span>`;
    renderChrome();
  }

  // Vistas
  function sec(title, inner, cls = '') {
    return `<section class="lsec ${cls}"><h2>${title}</h2>${inner}</section>`;
  }

  function viewLesson(l) {
    const b = l.block;
    Store.update((s) => { s.last = l.id; }, { study: false });
    const idx = LESSONS.indexOf(l);
    const prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
    const isLastOfBlock = l.li === b.lessons.length - 1;
    const p = lessonParts(l);
    const m = $('#main');
    m.innerHTML = '';
    const top = document.createElement('div');
    top.className = 'lesson';
    let html = `<div class="crumbs"><a href="#inicio">Ruta</a><span>›</span><span>Bloque ${b.n} · ${esc(b.title)}</span><span>›</span><span>Lección ${l.li + 1} de ${b.lessons.length}</span></div>
      <header class="lhead"><p class="eyebrow">Bloque ${b.n} · ${esc(b.level)}</p><h1>${esc(l.title)}</h1>
      <div class="chips">${(l.fns || []).map((f) => `<span class="chip mono">${esc(f)}</span>`).join('')}</div>
      <div class="lmeter"><div class="meter" id="lesson-meter" style="--p:${p.total ? p.done / p.total : 0}"><span></span></div><span id="lesson-meter-txt" class="muted">${p.done} de ${p.total}</span><span id="lesson-status"></span></div></header>`;
    if (l.why) html += sec('Para qué sirve', `<div class="prose">${l.why}</div>`);
    if (l.syntax) html += sec('Sintaxis', l.syntax.map((s) => `<div class="syntax"><code class="sig-code">${esc(s.code)}</code>${s.args ? `<dl>${s.args.map(([a, d]) => `<dt><code>${esc(a)}</code></dt><dd>${d}</dd>`).join('')}</dl>` : ''}</div>`).join(''));
    if (l.read) html += `<div class="readline"><span class="eyebrow">Cómo se lee</span><p>${esc(l.read)}</p></div>`;
    if (l.steps) html += sec('Paso a paso en Excel', `<ol class="steps">${l.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`);
    if (l.copies) html += `<div class="copies">${l.copies.map((c, i) => `<button class="btn ghost" data-copy="${i}">${ICON.copy}${esc(c.label)}</button>`).join('')}</div>`;
    if (l.code) html += sec('Código VBA', l.code.map((c, i) => `<div class="codebox"><div class="code-head"><span>${esc(c.title)}</span><button class="btn link" data-code="${i}">${ICON.copy}Copiar</button></div><pre><code>${esc(c.vba)}</code></pre></div>`).join(''));
    if (l.example) html += sec('Ejemplo', `<div class="example"><div class="fbar static"><div class="namebox">Ejemplo</div><div class="fx">fx</div><code class="ex-f">${esc(l.example.f)}</code><button class="btn ghost" data-try type="button">${ICON.play}Probar</button></div><p class="prose">${l.example.explain}</p><div class="example-out"></div></div>`);
    if (l.tips) html += sec('Trucos', `<ul class="bul">${l.tips.map((t) => `<li>${t}</li>`).join('')}</ul>`, 'tips');
    if (l.mistakes) html += sec('Errores comunes', `<ul class="bul warnlist">${l.mistakes.map((t) => `<li>${t}</li>`).join('')}</ul>`, 'mist');
    if (l.doit) html += sec('Hazlo en tu Excel', `<p class="muted small">${l.requireDoit ? 'Marca cada paso cuando lo tengas en tu archivo. Cuentan para completar la lección.' : 'Opcional pero recomendado: hazlo en tu archivo real.'}</p><div class="doit">${l.doit.map((d, i) => `<label class="check"><input type="checkbox" id="d-${esc(l.id)}-${i}" data-doit="${i}" ${doitDone(l, i) ? 'checked' : ''}><span class="box">${ICON.check}</span><span>${esc(d)}</span></label>`).join('')}</div>`);
    top.innerHTML = html;
    m.appendChild(top);

    const hasFormula = (l.exercises || []).some((e) => e.type === 'formula') || l.example;
    let panel = null;
    if (hasFormula && l.tables) panel = dataPanel(l.tables, 'Datos del simulador');

    if (l.exercises && l.exercises.length) {
      const prac = document.createElement('section');
      prac.className = 'lsec practice';
      prac.innerHTML = '<h2>Práctica</h2>';
      if (panel) prac.appendChild(panel);
      const list = document.createElement('div');
      list.className = 'ex-list';
      l.exercises.forEach((e) => list.appendChild(exerciseEl(e, panel)));
      prac.appendChild(list);
      top.appendChild(prac);
    }

    const nav = document.createElement('nav');
    nav.className = 'lnav';
    const nextHref = isLastOfBlock ? '#quiz-' + b.id : next ? '#' + next.id : '#inicio';
    const nextLabel = isLastOfBlock ? 'Quiz del bloque' : next ? 'Siguiente lección' : 'Volver a la ruta';
    nav.innerHTML = `${prev ? `<a class="btn ghost" href="#${prev.id}">← Anterior</a>` : '<span></span>'}<a class="btn primary" id="lesson-next-cta" href="${nextHref}">${nextLabel} →</a>`;
    top.appendChild(nav);

    top.addEventListener('click', (ev) => {
      const cp = ev.target.closest('[data-copy]');
      if (cp) copyText(copySpecText(l.copies[+cp.dataset.copy]), cp);
      const cd = ev.target.closest('[data-code]');
      if (cd) copyText(l.code[+cd.dataset.code].vba, cd);
      if (ev.target.closest('[data-try]')) {
        const r = XL.evaluate(l.example.f, TABLES);
        $('.example-out', top).innerHTML = resultHTML(r);
        if (panel) { panel.highlight([...r.ctx.tablesUsed][0], r.ctx.mask); }
      }
    });
    top.addEventListener('change', (ev) => {
      const cb = ev.target.closest('[data-doit]');
      if (!cb) return;
      const before = snapshot();
      Store.update((s) => { const k = doitKey(l, +cb.dataset.doit); if (cb.checked) s.doit[k] = Date.now(); else { delete s.doit[k]; s.undo[k] = Date.now(); } });
      if (cb.checked) toast(`${ICON.check} Paso hecho <span class="xp">+${XP.doit} XP</span>`, 'ok');
      celebrateDiff(before);
      updateLessonProgress(l);
    });
    updateLessonProgress(l);
    window.scrollTo(0, 0);
  }

  function viewQuiz(b) {
    const m = $('#main');
    const qs = b.quiz;
    let i = 0, score = 0;
    const misses = [];
    const best = S().quiz[b.id] || 0;
    function renderQ() {
      const q = qs[i];
      m.innerHTML = `<div class="quiz"><div class="crumbs"><a href="#inicio">Ruta</a><span>›</span><span>Bloque ${b.n} · ${esc(b.title)}</span><span>›</span><span>Quiz</span></div>
        <header class="qhead"><p class="eyebrow">Quiz · necesitas 80% para completar el bloque${best ? ' · tu mejor: ' + Math.round(best * 100) + '%' : ''}</p>
        <div class="qprog"><div class="meter" style="--p:${i / qs.length}"><span></span></div><span class="muted">${i + 1} / ${qs.length}</span></div></header>
        <div class="qcard"><h2 class="qtext">${q.q}</h2><div class="choices">${q.o.map((o, k) => `<button class="choice" data-k="${k}" type="button"><span class="choice-l">${String.fromCharCode(65 + k)}</span><span>${o}</span></button>`).join('')}</div>
        <div class="qfb" aria-live="polite"></div></div></div>`;
      const card = $('.qcard', m);
      card.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.choice');
        if (!btn || btn.disabled) return;
        const k = +btn.dataset.k;
        $$('.choice', card).forEach((x) => { x.disabled = true; });
        const right = k === q.a;
        if (right) score++; else misses.push(q);
        btn.classList.add(right ? 'right' : 'wrong');
        if (!right) $$('.choice', card)[q.a].classList.add('right');
        $('.qfb', card).innerHTML = `<div class="fb ${right ? 'good' : 'bad'}">${right ? ICON.check + ' Correcto. ' : 'No. '}${q.why}</div><button class="btn primary" id="qnext" type="button">${i + 1 < qs.length ? 'Siguiente' : 'Ver resultado'} →</button>`;
        const nb = $('#qnext'); nb.focus();
        nb.addEventListener('click', () => { i++; if (i < qs.length) renderQ(); else renderEnd(); });
      });
    }
    function renderEnd() {
      const pct = score / qs.length;
      const pass = pct >= 0.8;
      const before = snapshot();
      Store.update((s) => { s.quiz[b.id] = Math.max(s.quiz[b.id] || 0, pct); });
      const lessonsLeft = b.lessons.filter((l) => !lessonDone(l));
      m.innerHTML = `<div class="quiz"><div class="qend ${pass ? 'pass' : ''}">
        <div class="score-ring" style="--p:${pct}"><span>${Math.round(pct * 100)}%</span></div>
        <h1>${pass ? '¡Quiz aprobado!' : 'Casi, otra vuelta'}</h1>
        <p>${score} de ${qs.length} correctas. ${pass ? (lessonsLeft.length ? 'Te faltan ' + lessonsLeft.length + ' lección(es) del bloque para completarlo.' : '') : 'Necesitas 80%. Repasa los temas de abajo y vuelve a intentarlo.'}</p>
        ${misses.length ? `<div class="misses"><h2>Para repasar</h2>${misses.map((q) => `<div class="miss"><div class="miss-q">${q.q}</div><div class="miss-a">${ICON.check} ${q.o[q.a]}</div><div class="muted small">${q.why}</div></div>`).join('')}</div>` : ''}
        <div class="row-actions"><button class="btn ghost" id="qretry" type="button">Repetir quiz</button>${lessonsLeft.length ? `<a class="btn primary" href="#${lessonsLeft[0].id}">Ir a lo pendiente</a>` : `<a class="btn primary" href="#inicio">Ver la ruta</a>`}</div></div></div>`;
      $('#qretry').addEventListener('click', () => viewQuiz(b));
      if (pass) { confetti(120); toast(`<b>Quiz aprobado</b> <span class="xp">+${XP.quiz} XP</span>`, 'big'); }
      celebrateDiff(before);
      renderChrome();
    }
    renderQ();
    window.scrollTo(0, 0);
  }

  function viewHome() {
    const lv = levelInfo();
    const nx = nextLesson();
    const totalEx = EX.size, doneEx = [...EX.values()].filter(exDone).length;
    const m = $('#main');
    const contHref = nx ? (nx.quizOf ? '#quiz-' + nx.quizOf.id : '#' + nx.id) : '#certificado';
    const contLabel = nx ? (nx.quizOf ? 'Quiz del Bloque ' + nx.quizOf.n : nx.title) : 'Ver certificado';
    const contBlock = nx ? (nx.quizOf ? nx.quizOf : nx.block) : null;
    m.innerHTML = `<div class="home">
      <section class="hero">
        <div class="hero-text"><p class="eyebrow">Ruta del Analista de Datos · Excel</p><h1>Hola, ${esc(S().name || 'estudiante')}</h1>
        <p class="lead">De fórmulas intermedias a Power Query y VBA, practicando con la Tienda de Don Pepe. ${BLOCKS.length} bloques, ${LESSONS.length} lecciones, ${totalEx} ejercicios.</p>
        <a class="continue" href="${contHref}"><span class="continue-ic">${ICON.play}</span><span><span class="eyebrow">${nx ? 'Continuar · Bloque ' + contBlock.n : 'Ruta completada'}</span><span class="continue-t">${esc(contLabel)}</span></span></a></div>
        <div class="levelcard"><div class="lv-ring" style="--p:${lv.pct}"><span class="lv-ic">${ICON.award}</span></div>
          <div><p class="eyebrow">Tu nivel</p><p class="lv-name">${esc(lv.cur.name)}</p><p class="muted small">${lv.next ? (lv.next.need - lv.n) + ' bloque(s) para ' + esc(lv.next.name) : 'Nivel máximo'}</p></div></div>
      </section>
      <section class="stats">
        <div class="stat"><span class="stat-ic xp">${ICON.bolt}</span><span class="stat-v">${totalXP().toLocaleString('es-PE')}</span><span class="stat-l">XP</span></div>
        <div class="stat"><span class="stat-ic fire">${ICON.flame}</span><span class="stat-v">${Store.streak()}</span><span class="stat-l">días de racha</span></div>
        <div class="stat"><span class="stat-ic">${ICON.check}</span><span class="stat-v">${doneEx}<small>/${totalEx}</small></span><span class="stat-l">ejercicios</span></div>
        <div class="stat"><span class="stat-ic">${ICON.award}</span><span class="stat-v">${lv.n}<small>/${BLOCKS.length}</small></span><span class="stat-l">bloques</span></div>
      </section>
      <section class="route"><h2>Tu ruta</h2><ol class="path">${BLOCKS.map((b) => blockCard(b)).join('')}</ol></section>
    </div>`;
    window.scrollTo(0, 0);
  }

  function blockCard(b) {
    const un = blockUnlocked(b), done = blockDone(b), pct = blockPct(b);
    const state = done ? 'done' : un ? (pct > 0 ? 'active' : 'open') : 'locked';
    const first = b.lessons.find((l) => !lessonDone(l)) || b.lessons[0];
    const href = un ? (done ? '#' + b.lessons[0].id : first && !lessonDone(first) ? '#' + first.id : '#quiz-' + b.id) : null;
    const lessonsDone = b.lessons.filter(lessonDone).length;
    const inner = `<span class="node">${done ? ICON.check : un ? b.n : ICON.lock}</span>
      <span class="bc-body"><span class="bc-top"><span class="eyebrow">Bloque ${b.n}</span><span class="tag lv-${esc(b.level.replace('+', 'p'))}">${esc(b.level)}</span></span>
      <span class="bc-title">${esc(b.title)}</span><span class="bc-sub">${esc(b.subtitle)}</span>
      ${un ? `<span class="bc-meter"><span class="meter" style="--p:${pct}"><span></span></span><span class="muted small">${lessonsDone}/${b.lessons.length} lecciones${quizPassed(b) ? ' · quiz ✓' : ''}</span></span>` : `<span class="muted small">Completa el Bloque ${b.n - 1} para desbloquear</span>`}</span>`;
    return `<li class="bc ${state}">${href ? `<a class="bc-link" href="${href}">${inner}</a>` : `<div class="bc-link" aria-disabled="true">${inner}</div>`}</li>`;
  }

  function viewLab() {
    const m = $('#main');
    m.innerHTML = `<div class="lab"><header class="lhead"><p class="eyebrow">Práctica libre</p><h1>Laboratorio</h1>
      <p class="lead">Escribe cualquier fórmula sobre las 4 tablas. Acepta nombres en inglés o español y separadores <code>,</code> o <code>;</code>.</p></header></div>`;
    const lab = $('.lab', m);
    const panel = dataPanel(Object.keys(C.tables), 'Tablas disponibles');
    const out = document.createElement('div'); out.className = 'ex-out';
    const hist = document.createElement('div'); hist.className = 'hist';
    const history = [];
    const fb = formulaBar({
      id: 'lab-f', name: 'Lab', placeholder: '=SUMIFS(tblVentas[Total],tblVentas[Vendedor],"Ana")',
      onRun: (f) => {
        const r = XL.evaluate(f, TABLES);
        out.innerHTML = resultHTML(r) + (r.ctx.warn ? `<div class="fb warn">${esc(r.ctx.warn)}</div>` : '');
        panel.highlight([...r.ctx.tablesUsed][0], r.ok ? r.ctx.mask : null);
        if (f && history[0] !== f) { history.unshift(f); history.length = Math.min(history.length, 8); }
        hist.innerHTML = history.length ? `<p class="eyebrow">Historial</p>${history.map((h) => `<button class="hist-i mono" type="button">${esc(h)}</button>`).join('')}` : '';
      },
    });
    lab.appendChild(fb); lab.appendChild(out); lab.appendChild(panel); lab.appendChild(hist);
    hist.addEventListener('click', (e) => { const b = e.target.closest('.hist-i'); if (b) { fb.input.value = b.textContent; fb.input.focus(); } });
    const ref = document.createElement('section');
    ref.className = 'lsec';
    const names = Object.keys(XL.SIG).sort();
    ref.innerHTML = `<h2>Funciones del simulador</h2><input class="vinput" id="fn-search" placeholder="Buscar función..." autocomplete="off"><div class="fnlist">${names.map((n) => `<button class="fn-i" data-fn="${esc(n)}" type="button"><span class="mono">${esc(n)}</span><span class="muted small">${esc(XL.SIG[n])}</span></button>`).join('')}</div>`;
    lab.appendChild(ref);
    $('#fn-search', ref).addEventListener('input', (e) => {
      const q = e.target.value.trim().toUpperCase();
      $$('.fn-i', ref).forEach((b) => { b.hidden = q && !b.dataset.fn.includes(q); });
    });
    ref.addEventListener('click', (e) => { const b = e.target.closest('.fn-i'); if (b) { activeInput = fb.input; insertAtCursor(b.dataset.fn + '('); } });
    window.scrollTo(0, 0);
  }

  function viewCert() {
    const fin = BLOCKS[BLOCKS.length - 1];
    const m = $('#main');
    if (!blockDone(fin)) {
      const lv = levelInfo();
      m.innerHTML = `<div class="cert-locked"><div class="modal-badge">${ICON.lock}</div><h1>Certificado de Experto</h1>
        <p class="lead">Se desbloquea al completar los ${BLOCKS.length} bloques, incluido el proyecto final y su examen.</p>
        <div class="meter big" style="--p:${lv.n / BLOCKS.length}"><span></span></div><p class="muted">${lv.n} de ${BLOCKS.length} bloques completados</p>
        <a class="btn primary" href="#inicio">Volver a la ruta</a></div>`;
      return;
    }
    const ts = S().done['block:' + fin.id] || Date.now();
    const d = new Date(ts);
    const fecha = d.getDate() + ' de ' + ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d.getMonth()] + ' de ' + d.getFullYear();
    m.innerHTML = `<div class="cert-wrap"><div class="cert">
      <div class="cert-grid" aria-hidden="true"></div>
      <p class="eyebrow">Certificado de finalización</p>
      <h1 class="cert-name">${esc(S().name || 'Estudiante')}</h1>
      <p class="cert-line">completó la <b>Ruta del Analista de Datos en Excel</b> hasta el nivel</p>
      <p class="cert-level">Experto</p>
      <ul class="cert-skills">${BLOCKS.slice(1).map((b) => `<li>${esc(b.title)}</li>`).join('')}</ul>
      <div class="cert-foot"><span>${fecha}</span><span class="cert-seal">${ICON.award}</span><span>${totalXP().toLocaleString('es-PE')} XP · ${EX.size} ejercicios</span></div>
    </div><p class="muted small center">Toma una captura de pantalla para tu portafolio o LinkedIn.</p></div>`;
  }

  function viewProgress() {
    const m = $('#main');
    const u = Store.user();
    const saved = u ? `Tu progreso se guarda en tu cuenta (<b>${esc(u.email || '')}</b>): lo ves igual desde la PC o el celular. <a href="#cuenta">Ver cuenta</a>`
      : Store.enabled ? 'Tu progreso se guarda solo en este navegador. <a href="#cuenta">Crea una cuenta o entra</a> para verlo desde cualquier dispositivo.'
      : 'Tu progreso se guarda en este navegador.';
    m.innerHTML = `<div class="settings"><header class="lhead"><p class="eyebrow">Ajustes</p><h1>Tu progreso</h1></header>
      <section class="lsec"><h2>Guardado</h2><p>${saved}</p></section>
      <section class="lsec"><h2>Nombre en el certificado</h2><form id="name-form" class="value-form"><label class="sr" for="name-in">Nombre</label><input id="name-in" class="vinput" value="${esc(S().name || '')}" maxlength="60"><button class="btn primary" type="submit">Guardar</button></form></section>
      <section class="lsec"><h2>Modo libre</h2><label class="check"><input type="checkbox" id="free-in" ${S().free ? 'checked' : ''}><span class="box">${ICON.check}</span><span>Desbloquear todos los bloques (para repasar o adelantarte). Los certificados y niveles igual requieren completar todo.</span></label></section>
      <section class="lsec"><h2>Detalle por bloque</h2><div class="grid-wrap"><table class="grid prog"><thead><tr><th>Bloque</th><th>Lecciones</th><th>Ejercicios</th><th>Quiz</th></tr></thead><tbody>
        ${BLOCKS.map((b) => { const ex = b.lessons.flatMap((l) => l.exercises || []); return `<tr><td>${b.n}. ${esc(b.title)}</td><td class="num">${b.lessons.filter(lessonDone).length}/${b.lessons.length}</td><td class="num">${ex.filter(exDone).length}/${ex.length}</td><td class="num">${S().quiz[b.id] ? Math.round(S().quiz[b.id] * 100) + '%' : '—'}</td></tr>`; }).join('')}
      </tbody></table></div></section>
      <section class="lsec danger"><h2>Reiniciar</h2><p class="muted">Borra todos los ejercicios, quizzes y XP. No se puede deshacer.</p><div id="reset-zone"><button class="btn ghost" id="reset-1" type="button">Reiniciar progreso</button></div></section></div>`;
    $('#name-form').addEventListener('submit', (e) => { e.preventDefault(); Store.update((s) => { s.name = $('#name-in').value.trim(); }, { study: false }); toast('Nombre guardado'); });
    $('#free-in').addEventListener('change', (e) => { Store.update((s) => { s.free = e.target.checked; }, { study: false }); renderChrome(); });
    $('#reset-1').addEventListener('click', () => {
      $('#reset-zone').innerHTML = `<p><b>¿Seguro?</b> Se borra todo tu avance.</p><div class="row-actions"><button class="btn danger" id="reset-2" type="button">Sí, reiniciar</button><button class="btn ghost" id="reset-no" type="button">Cancelar</button></div>`;
      $('#reset-2').addEventListener('click', () => { Store.reset(); toast('Progreso reiniciado'); location.hash = '#inicio'; });
      $('#reset-no').addEventListener('click', viewProgress);
    });
  }

  let authTab = 'in';
  let recovering = false;

  function viewAccount() {
    const m = $('#main');
    const u = Store.user();
    const wrap = (title, lead, body) => `<div class="settings auth"><header class="lhead"><p class="eyebrow">Cuenta</p><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</header>${body}</div>`;
    const say = (el, text, ok) => { el.textContent = text; el.classList.toggle('ok', !!ok); };

    if (!Store.enabled) {
      m.innerHTML = wrap('Cuenta no disponible', '', '<section class="lsec"><p>Las cuentas todavía no están activadas en esta página, así que tu progreso se guarda solo en este navegador.</p></section>');
      return;
    }

    if (u) {
      const st = { ok: 'Todo está guardado.', pending: 'Guardando tu avance.', offline: 'Sin conexión: se guardará cuando vuelvas a tener internet.', error: 'No se pudo guardar en la cuenta, se reintenta al seguir.' }[Store.status()] || '';
      m.innerHTML = wrap(recovering ? 'Elige tu nueva contraseña' : 'Tu cuenta', '',
        `${recovering ? '' : `<section class="lsec"><h2>Sesión</h2><p>Entraste como <b>${esc(u.email || '')}</b>. ${st}</p><div class="row-actions start"><button class="btn ghost" id="logout" type="button">Cerrar sesión</button></div></section>`}
        <section class="lsec"><h2>${recovering ? 'Nueva contraseña' : 'Cambiar contraseña'}</h2>
          <form id="pw-form" class="auth-form" novalidate><label class="field"><span>Nueva contraseña</span><input class="vinput" id="pw-in" type="password" autocomplete="new-password" minlength="6"></label>
          <p class="form-msg" id="pw-msg" role="alert"></p><button class="btn primary" type="submit">Guardar contraseña</button></form></section>`);
      const lo = $('#logout');
      if (lo) lo.addEventListener('click', async () => {
        lo.disabled = true;
        try { await Store.signOut(); } catch (err) {
          lo.disabled = false;
          if (err.code !== 'unsaved' || !confirm('No se pudo guardar tu último avance en la cuenta (¿sin conexión?). Si sales ahora, ese avance se pierde en este dispositivo. ¿Salir igual?')) return;
          await Store.signOut({ force: true });
        }
        toast('Sesión cerrada');
        location.hash = '#inicio';
      });
      $('#pw-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = $('#pw-msg'), pw = $('#pw-in').value;
        if (pw.length < 6) { say(msg, 'La contraseña necesita al menos 6 caracteres'); return; }
        try {
          await Store.setPassword(pw);
          recovering = false;
          toast(`${ICON.check} Contraseña actualizada`, 'ok');
          viewAccount();
        } catch (err) { say(msg, Store.errorText(err)); }
      });
      return;
    }

    const up = authTab === 'up';
    m.innerHTML = wrap('Guarda tu progreso', 'Crea tu cuenta gratis y sigue desde tu PC, tu celular o donde quieras. Lo que ya hiciste en este navegador se suma a tu cuenta.',
      `<section class="lsec"><div class="tabs auth-tabs" role="tablist"><button role="tab" class="tab ${up ? '' : 'on'}" data-tab="in" aria-selected="${!up}" type="button">Entrar</button><button role="tab" class="tab ${up ? 'on' : ''}" data-tab="up" aria-selected="${up}" type="button">Crear cuenta</button></div>
        <form id="auth-form" class="auth-form" novalidate>
          ${up ? `<label class="field"><span>Nombre (sale en tu certificado)</span><input class="vinput" id="au-name" autocomplete="name" maxlength="60" value="${esc(S().name || '')}"></label>` : ''}
          <label class="field"><span>Correo</span><input class="vinput" id="au-mail" type="email" autocomplete="email"></label>
          <label class="field"><span>Contraseña</span><input class="vinput" id="au-pw" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="6"></label>
          <p class="form-msg" id="au-msg" role="alert"></p>
          <button class="btn primary" id="au-go" type="submit">${up ? 'Crear cuenta' : 'Entrar'}</button>
          ${up ? '' : '<button class="btn link" id="forgot" type="button">Olvidé mi contraseña</button>'}
        </form></section>`);
    $$('.auth-tabs .tab').forEach((t) => t.addEventListener('click', () => { authTab = t.dataset.tab; viewAccount(); }));
    const msg = $('#au-msg'), go = $('#au-go');
    const idle = () => { go.disabled = false; go.textContent = up ? 'Crear cuenta' : 'Entrar'; };
    $('#auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#au-mail').value.trim(), pw = $('#au-pw').value, name = up ? $('#au-name').value.trim() : '';
      if (!email || !pw || (up && !name)) { say(msg, 'Completa todos los campos'); return; }
      if (pw.length < 6) { say(msg, 'La contraseña necesita al menos 6 caracteres'); return; }
      say(msg, ''); go.disabled = true; go.textContent = 'Un momento';
      try {
        if (up) {
          const r = await Store.signUp(name, email, pw);
          if (!r.confirmed) { say(msg, 'Listo, te mandamos un correo para confirmar la cuenta. Ábrelo y vuelve aquí para entrar.', true); idle(); return; }
        } else {
          await Store.signIn(email, pw);
        }
        toast(`${ICON.check} Sesión iniciada`, 'ok');
        location.hash = '#inicio';
      } catch (err) { say(msg, Store.errorText(err)); idle(); }
    });
    const fg = $('#forgot');
    if (fg) fg.addEventListener('click', async () => {
      const email = $('#au-mail').value.trim();
      if (!email) { say(msg, 'Escribe tu correo arriba y vuelve a tocar este botón'); return; }
      try { await Store.recover(email); say(msg, 'Si ese correo tiene cuenta, te mandamos un enlace para cambiar la contraseña', true); } catch (err) { say(msg, Store.errorText(err)); }
    });
  }

  // Barra superior y lateral
  function renderChrome() {
    const lv = levelInfo();
    const acc = $('#top-acc');
    const au = Store.user();
    acc.hidden = !Store.enabled;
    acc.classList.toggle('in', !!au);
    acc.title = au ? 'Tu cuenta: ' + (au.email || '') : 'Entrar o crear cuenta';
    acc.innerHTML = au ? `<span class="avatar">${esc((S().name || au.email || '?').trim().charAt(0).toUpperCase())}</span>` : `${ICON.user}<span class="acc-t">Entrar</span>`;
    const sync = Store.status();
    const foot = sync === 'local'
      ? (Store.enabled ? 'Guardado solo en este navegador · <a href="#cuenta">Guardar en una cuenta</a>' : 'Progreso guardado en este navegador')
      : { ok: 'Progreso guardado en tu cuenta', pending: 'Guardando', offline: 'Sin conexión, se guardará al volver', error: 'No se pudo guardar en tu cuenta, se reintenta al seguir' }[sync];
    $('#top-level').innerHTML = `<span class="tl-name">${esc(lv.cur.name)}</span><span class="meter thin" style="--p:${lv.pct}"><span></span></span>`;
    $('#top-xp').innerHTML = `${ICON.bolt}<span>${totalXP().toLocaleString('es-PE')}</span>`;
    $('#top-streak').innerHTML = `${ICON.flame}<span>${Store.streak()}</span>`;
    const route = location.hash.slice(1) || 'inicio';
    const curLesson = LESSONS.find((l) => l.id === route);
    const curBlock = curLesson ? curLesson.block : route.startsWith('quiz-') ? BLOCKS.find((b) => 'quiz-' + b.id === route) : null;
    const nav = $('#sidebar');
    nav.innerHTML = `<div class="side-main">
        <a href="#inicio" class="side-i ${route === 'inicio' ? 'on' : ''}">${ICON.home}Ruta</a>
        <a href="#laboratorio" class="side-i ${route === 'laboratorio' ? 'on' : ''}">${ICON.flask}Laboratorio</a>
        <a href="#certificado" class="side-i ${route === 'certificado' ? 'on' : ''}">${ICON.award}Certificado</a>
        <a href="#progreso" class="side-i ${route === 'progreso' ? 'on' : ''}">${ICON.gear}Ajustes</a></div>
      <p class="side-label">Bloques</p>
      <div class="side-blocks">${BLOCKS.map((b) => {
        const un = blockUnlocked(b), done = blockDone(b), open = curBlock === b;
        return `<details class="sb ${done ? 'done' : ''} ${un ? '' : 'locked'}" ${open ? 'open' : ''}><summary><span class="sb-n">${done ? ICON.check : un ? b.n : ICON.lock}</span><span class="sb-t">${esc(b.title)}</span><span class="sb-p" style="--p:${blockPct(b)}"></span></summary>
          ${un ? `<ul>${b.lessons.map((l) => `<li><a href="#${l.id}" class="${l === curLesson ? 'on' : ''} ${lessonDone(l) ? 'ok' : ''}"><span class="dot">${lessonDone(l) ? ICON.check : ''}</span>${esc(l.title)}</a></li>`).join('')}
          <li><a href="#quiz-${b.id}" class="${route === 'quiz-' + b.id ? 'on' : ''} ${quizPassed(b) ? 'ok' : ''}"><span class="dot">${quizPassed(b) ? ICON.check : ICON.quiz}</span>Quiz del bloque</a></li></ul>` : '<p class="muted small sb-lock">Completa el bloque anterior</p>'}</details>`;
      }).join('')}</div>
      <p class="side-foot muted small">${foot}</p>`;
  }

  function route() {
    document.body.classList.remove('nav-open');
    $('#modal').hidden = true;
    const r = location.hash.slice(1) || 'inicio';
    const l = LESSONS.find((x) => x.id === r);
    if (l) {
      if (!blockUnlocked(l.block)) { lockedView(l.block); }
      else viewLesson(l);
    } else if (r.startsWith('quiz-')) {
      const b = BLOCKS.find((x) => 'quiz-' + x.id === r);
      if (!b) viewHome();
      else if (!blockUnlocked(b)) lockedView(b);
      else viewQuiz(b);
    } else if (r === 'laboratorio') viewLab();
    else if (r === 'certificado') viewCert();
    else if (r === 'progreso') viewProgress();
    else if (r === 'cuenta') viewAccount();
    else viewHome();
    renderChrome();
    $('#main').focus({ preventScroll: true });
  }
  function lockedView(b) {
    const prev = BLOCKS[b.n - 1];
    $('#main').innerHTML = `<div class="cert-locked"><div class="modal-badge">${ICON.lock}</div><h1>Bloque ${b.n}: ${esc(b.title)}</h1>
      <p class="lead">${esc(b.desc)}</p><p>Se desbloquea al completar el <b>Bloque ${prev.n}: ${esc(prev.title)}</b> (todas sus lecciones y su quiz con 80%).</p>
      <div class="row-actions"><a class="btn primary" href="#${(prev.lessons.find((x) => !lessonDone(x)) || prev.lessons[0]).id}">Ir al Bloque ${prev.n}</a><a class="btn ghost" href="#progreso">Modo libre</a></div></div>`;
  }

  $('#menu-btn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
  window.addEventListener('hashchange', route);

  let booted = false;
  Store.on(() => { if (booted) renderChrome(); });
  Store.init().then(() => {
    const L = Store.landing;
    if (L && L.type === 'error') toast(Store.errorText({ code: L.code }));
    else if (L && L.type === 'recovery') { recovering = true; location.hash = '#cuenta'; }
    else if (L) toast(`${ICON.check} Correo confirmado, ya estás dentro`, 'ok');
    // Si el progreso llegó desde la cuenta después del primer render, refresca la vista actual
    if (Store.mode() === 'cuenta' && !document.activeElement.matches('input')) route();
  });
  booted = true;
  route();
})();
