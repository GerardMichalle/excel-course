// Progreso: siempre se guarda en este navegador. Con sesión iniciada también se sube a la cuenta (Supabase)
// para verlo igual desde cualquier dispositivo. Sin librerías: Auth y base de datos por REST.
(function () {
  const KEY = 'ruta-excel-progreso-v1';
  const SKEY = 'ruta-excel-sesion-v1';
  const PKEY = 'ruta-excel-pendiente-v1';
  const CFG = window.RUTA_CONFIG || {};
  const BASE = String(CFG.supabaseUrl || '').replace(/\/+$/, '');
  const enabled = !!(BASE && CFG.supabaseKey);
  const blank = () => ({ v: 1, name: '', epoch: 0, ex: {}, doit: {}, undo: {}, quiz: {}, done: {}, days: [], last: null, free: false });

  let state = blank();
  let session = null;
  let status = 'local';
  let dirty = false;
  let running = false;
  let again = false;
  let timer = null;
  let lastSync = 0;
  let refreshing = null;
  const listeners = [];

  const stable = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((r, x) => ((r[x] = v[x]), r), {}) : v));
  const emit = () => listeners.forEach((f) => f(state));

  // b gana en los campos sueltos (nombre, modo libre, última lección); el avance se junta sin perder nada.
  // Un reinicio (epoch más nuevo) reemplaza todo lo anterior.
  function merge(a, b) {
    const ea = a.epoch || 0, eb = b.epoch || 0;
    if (ea !== eb) return { ...blank(), ...(ea > eb ? a : b) };
    const out = blank();
    out.epoch = ea;
    out.name = b.name || a.name || '';
    out.free = !!b.free;
    out.last = b.last || a.last || null;
    out.done = { ...a.done, ...b.done };
    out.ex = { ...a.ex };
    for (const [k, v] of Object.entries(b.ex || {})) if (!out.ex[k] || v === 'full') out.ex[k] = v;
    out.quiz = { ...a.quiz };
    for (const [k, v] of Object.entries(b.quiz || {})) out.quiz[k] = Math.max(out.quiz[k] || 0, v);
    out.days = [...new Set([...(a.days || []), ...(b.days || [])])].sort().slice(-500);
    out.undo = { ...a.undo };
    for (const [k, v] of Object.entries(b.undo || {})) out.undo[k] = Math.max(out.undo[k] || 0, v);
    out.doit = { ...a.doit };
    for (const [k, v] of Object.entries(b.doit || {})) out.doit[k] = Math.max(out.doit[k] || 0, v);
    for (const k of Object.keys(out.doit)) if ((out.undo[k] || 0) > out.doit[k]) delete out.doit[k];
    return out;
  }

  function loadLocal() {
    try { const t = localStorage.getItem(KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; }
  }
  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento local */ }
  }
  function setDirty(v) {
    dirty = v;
    try { if (v) localStorage.setItem(PKEY, '1'); else localStorage.removeItem(PKEY); } catch (e) { /* igual */ }
  }

  async function api(path, { method = 'GET', body, auth = false, headers = {}, keepalive = false } = {}) {
    const h = { apikey: CFG.supabaseKey, ...headers };
    if (body !== undefined) h['Content-Type'] = 'application/json';
    if (auth) h.Authorization = 'Bearer ' + session.access_token;
    let res;
    try {
      res = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), keepalive });
    } catch (e) {
      const err = new Error('sin conexión');
      err.code = 'network';
      throw err;
    }
    const text = await res.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch (e) { data = null; } }
    if (!res.ok) {
      const err = new Error((data && (data.msg || data.message || data.error_description)) || res.statusText);
      err.status = res.status;
      err.code = data && (data.error_code || data.code);
      throw err;
    }
    return data;
  }

  function setSession(d) {
    const u = d.user || {};
    session = {
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (+d.expires_in || 3600),
      user: { id: u.id, email: u.email },
    };
    try { localStorage.setItem(SKEY, JSON.stringify(session)); } catch (e) { /* igual */ }
  }
  function clearSession() {
    session = null;
    try { localStorage.removeItem(SKEY); } catch (e) { /* igual */ }
  }
  function loadSession() {
    try { const t = localStorage.getItem(SKEY); const s = t ? JSON.parse(t) : null; return s && s.refresh_token && s.user && s.user.id ? s : null; } catch (e) { return null; }
  }

  function refresh() {
    if (!refreshing) {
      refreshing = api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } })
        .then(setSession)
        .catch((e) => {
          if ([400, 401, 403].includes(e.status)) { clearSession(); status = 'local'; emit(); }
          throw e;
        })
        .finally(() => { refreshing = null; });
    }
    return refreshing;
  }

  async function authed(path, opts) {
    if (!session) throw new Error('sin sesión');
    if (session.expires_at - 60 < Date.now() / 1000) await refresh();
    try {
      return await api(path, { ...opts, auth: true });
    } catch (e) {
      if (e.status !== 401 || !session) throw e;
      await refresh();
      return api(path, { ...opts, auth: true });
    }
  }

  const UPSERT = { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } };
  const rowBody = () => ({ user_id: session.user.id, data: state, updated_at: new Date().toISOString() });
  async function pull() {
    const rows = await authed('/rest/v1/progress?select=data&user_id=eq.' + session.user.id);
    return rows && rows[0] ? rows[0].data : null;
  }
  const push = () => authed('/rest/v1/progress?on_conflict=user_id', { ...UPSERT, body: rowBody() });

  // Trae lo de la cuenta, lo junta con lo local y sube lo que falte
  async function sync() {
    if (!session) return;
    const wasDirty = dirty;
    setDirty(false);
    try {
      const remote = await pull();
      const before = stable(state);
      if (remote) state = wasDirty ? merge(remote, state) : merge(state, remote);
      const after = stable(state);
      if (after !== before) saveLocal();
      if (!remote || after !== stable(remote)) await push();
      status = 'ok';
      lastSync = Date.now();
    } catch (e) {
      setDirty(true);
      status = e.code === 'network' ? 'offline' : 'error';
      console.warn('No se pudo sincronizar', e);
    }
    emit();
  }

  async function run() {
    if (running) { again = true; return; }
    running = true;
    try { do { again = false; await sync(); } while (again && session); } finally { running = false; }
  }

  function schedule() {
    if (!session) return;
    setDirty(true);
    status = 'pending';
    clearTimeout(timer);
    timer = setTimeout(run, 700);
  }

  // Al cerrar o cambiar de pestaña: sube lo pendiente sin esperar respuesta
  function flush() {
    if (!session || !dirty || session.expires_at < Date.now() / 1000) return;
    clearTimeout(timer);
    api('/rest/v1/progress?on_conflict=user_id', { ...UPSERT, body: rowBody(), auth: true, keepalive: true }).catch(() => {});
  }

  // Al volver de un enlace del correo (confirmar cuenta o recuperar contraseña) llegan los tokens en el hash
  function takeLanding() {
    const raw = location.hash.slice(1);
    if (!/(^|&)(access_token|error)=/.test(raw)) return null;
    const p = new URLSearchParams(raw);
    history.replaceState(null, '', location.pathname + location.search);
    if (p.get('error')) return { type: 'error', code: p.get('error_code') || p.get('error') };
    return {
      type: p.get('type') || 'signup',
      tokens: { access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_in: p.get('expires_in'), expires_at: +p.get('expires_at') || 0 },
    };
  }

  async function startSession(d) {
    setSession(d);
    status = 'pending';
    emit();
    await sync();
  }

  const MSG = {
    invalid_credentials: 'Correo o contraseña incorrectos',
    user_already_exists: 'Ese correo ya tiene cuenta, prueba entrando',
    email_exists: 'Ese correo ya tiene cuenta, prueba entrando',
    weak_password: 'La contraseña es muy débil, usa al menos 6 caracteres',
    email_not_confirmed: 'Falta confirmar tu correo, revisa tu bandeja',
    over_email_send_rate_limit: 'Demasiados correos seguidos, espera unos minutos',
    over_request_rate_limit: 'Demasiados intentos seguidos, espera unos minutos',
    validation_failed: 'Revisa que el correo esté bien escrito',
    email_address_invalid: 'Ese correo no es válido',
    signup_disabled: 'El registro de cuentas está desactivado',
    same_password: 'La nueva contraseña tiene que ser distinta a la anterior',
    otp_expired: 'El enlace venció, pide uno nuevo',
    access_denied: 'El enlace no es válido o ya se usó, pide uno nuevo',
    network: 'No hay conexión con el servidor, revisa tu internet',
    unsaved: 'No se pudo guardar tu último avance',
  };

  const Store = {
    enabled,
    landing: null,
    get: () => state,
    mode: () => (session ? 'cuenta' : 'local'),
    status: () => (session ? status : 'local'),
    user: () => (session ? session.user : null),
    on(f) { listeners.push(f); },
    errorText: (e) => MSG[e && e.code] || 'No se pudo completar, intenta de nuevo',
    update(fn, { study = true } = {}) {
      fn(state);
      if (study) { const t = today(); if (!state.days.includes(t)) state.days.push(t); }
      saveLocal(); schedule(); emit();
    },
    reset() {
      const name = state.name;
      state = blank(); state.name = name; state.epoch = Date.now();
      saveLocal(); schedule(); emit();
    },
    streak() {
      const set = new Set(state.days);
      const d = new Date();
      const key = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
      if (!set.has(key(d))) d.setDate(d.getDate() - 1);
      let n = 0;
      while (set.has(key(d))) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },

    async signUp(name, email, password) {
      const d = await api('/auth/v1/signup', { method: 'POST', body: { email, password, data: { name } } });
      if (!d || !d.access_token) return { confirmed: false };
      if (name) state.name = name;
      await startSession(d);
      return { confirmed: true };
    },
    async signIn(email, password) {
      await startSession(await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
    },
    async signOut({ force = false } = {}) {
      if (session) {
        clearTimeout(timer);
        if (dirty) await sync();
        if (dirty && !force) { const err = new Error('unsaved'); err.code = 'unsaved'; throw err; }
        try { await api('/auth/v1/logout', { method: 'POST', auth: true }); } catch (e) { /* la sesión de este navegador se borra igual */ }
      }
      clearSession();
      setDirty(false);
      state = blank();
      try { localStorage.removeItem(KEY); } catch (e) { /* igual */ }
      emit();
    },
    recover(email) {
      return api('/auth/v1/recover?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { method: 'POST', body: { email } });
    },
    setPassword(password) {
      return authed('/auth/v1/user', { method: 'PUT', body: { password } });
    },

    async init() {
      const local = loadLocal();
      if (local) state = merge(blank(), local);
      emit();
      if (!enabled) return;
      const landing = takeLanding();
      session = loadSession();
      try {
        if (landing && landing.tokens) {
          session = { ...landing.tokens, expires_at: landing.tokens.expires_at || Math.floor(Date.now() / 1000) + (+landing.tokens.expires_in || 3600), user: {} };
          const user = await api('/auth/v1/user', { auth: true });
          setSession({ ...landing.tokens, user });
        }
      } catch (e) {
        clearSession();
        landing.type = 'error';
        landing.code = e.code;
      }
      Store.landing = landing ? { type: landing.type, code: landing.code } : null;
      if (!session) return;
      status = 'pending';
      try { dirty = localStorage.getItem(PKEY) === '1'; } catch (e) { dirty = false; }
      emit();
      await sync();
    },
  };

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  if (enabled) {
    document.addEventListener('visibilitychange', () => {
      if (!session) return;
      if (document.visibilityState === 'hidden') flush();
      else if (dirty || Date.now() - lastSync > 20000) run();
    });
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', () => { if (session) run(); });
  }

  window.Store = Store;
})();
