const express = require('express'), crypto = require('crypto'), path = require('path');
const { STOPS, N, SKIP_PENALTY, waits, plan } = require('./graph');
const { store, init, save } = require('./storage');
const PORT = process.env.PORT || 3000, PUBLIC = path.join(__dirname, '..', 'public');
const STALE_MS = 40 * 60e3, SESSION_MS = 12 * 3600e3;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);                             // Render está detrás de un proxy
app.use((req, res, next) => {                          // cabeceras de seguridad
  res.set({
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  });
  next();
});
app.use(express.json({ limit: '5kb' }));
app.use('/src', express.static(path.join(PUBLIC, 'src'), { index: false, dotfiles: 'ignore' }));
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC, 'src', 'html', 'index.html')));

// ---------- Login (con límite de intentos fallidos por IP) ----------
const fails = new Map();
const recentFails = ip => { const now = Date.now(), t = (fails.get(ip) || []).filter(x => now - x < 10 * 60e3); fails.set(ip, t); return t; };
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32);
app.post('/api/login', (req, res) => {
  if (recentFails(req.ip).length >= 10) return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
  const S = store.data, name = String(req.body.name || '').trim().slice(0, 30), pw = String(req.body.password || ''), ruta = +req.body.ruta;
  if (!name || pw.length < 4 || pw.length > 100) return res.status(400).json({ error: 'Ingresa nombre y contraseña (mínimo 4 caracteres).' });
  if (![2, 13, 22].includes(ruta)) return res.status(400).json({ error: 'Elige la ruta 2, 13 o 22.' });
  const key = name.toLowerCase();
  let u = S.users[key];
  if (!u) { const salt = crypto.randomBytes(8).toString('hex'); u = S.users[key] = { name, salt, hash: hash(pw, salt).toString('hex') }; }
  else if (!crypto.timingSafeEqual(hash(pw, u.salt), Buffer.from(u.hash, 'hex'))) {
    recentFails(req.ip).push(Date.now());
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  S.sessions[token] = { key, at: Date.now() };
  u.ruta = ruta; save();
  res.json({ token });
});

app.use('/api', (req, res, next) => {                  // autenticación por token
  const S = store.data, t = (req.headers.authorization || '').replace('Bearer ', ''), s = S.sessions[t];
  if (!s || !S.users[s.key] || Date.now() - s.at > SESSION_MS) { delete S.sessions[t]; return res.status(401).json({ error: 'Sesión no válida.' }); }
  req.key = s.key; req.token = t; req.user = S.users[s.key]; next();
});

function snapshot(key) {
  const now = Date.now(), B = store.data.buses, w = waits(B, now), buses = Object.values(B);
  const stops = STOPS.map(s => ({
    ...s, wait: Math.round(w[s.id]),
    atStop: buses.filter(b => b.status === 'enParada' && b.current === s.id).length,
    heading: buses.filter(b => b.status === 'enRuta' && b.target === s.id).length,
  }));
  const b = B[key] || null;
  let me = { bus: b };
  if (b) {
    const p = plan(b.current, w);
    me = { bus: b, etas: p.d.map(x => (x === Infinity ? null : Math.round(x))), plan: p.path, suggest: p.next, skipped: p.skipped };
  }
  return { now, stops, active: buses.length, me, penalty: SKIP_PENALTY };
}
app.get('/api/state', (req, res) => res.json(snapshot(req.key)));

const act = fn => (req, res) => {
  const b = store.data.buses[req.key], err = fn(b, req);
  if (err) return res.status(400).json({ error: err });
  if (store.data.buses[req.key]) store.data.buses[req.key].updatedAt = Date.now();
  save(); res.json(snapshot(req.key));
};
app.post('/api/start', (req, res) => {                 // inicia en la Glorieta (nodo 0); el sistema asigna la primera parada
  const B = store.data.buses;
  if (B[req.key]) return res.status(400).json({ error: 'Ya tienes un trayecto activo.' });
  const p = plan(0, waits(B));
  B[req.key] = { id: req.key, name: req.user.name, ruta: req.user.ruta, status: 'enRuta', current: 0, target: p.next, manual: false, departedAt: Date.now(), updatedAt: Date.now() };
  save(); res.json(snapshot(req.key));
});
app.post('/api/arrive', act(b => {                     // el chofer informa que llegó
  if (!b || b.status !== 'enRuta') return 'No estás en ruta hacia una parada.';
  Object.assign(b, { status: 'enParada', current: b.target, arrivedAt: Date.now() });
}));
app.post('/api/depart', act((b, req) => {              // el chofer informa que salió
  if (!b || b.status !== 'enParada') return 'No estás en una parada.';
  if (b.current === N) { delete store.data.buses[req.key]; return; }   // fin del trayecto
  const p = plan(b.current, waits(store.data.buses));
  const keep = b.manual && b.target > b.current;
  Object.assign(b, { status: 'enRuta', target: keep ? b.target : p.next, manual: false, departedAt: Date.now() });
}));
app.post('/api/target', act((b, req) => {              // el chofer elige otra parada en el mapa
  const stop = +req.body.stop;
  if (!b) return 'Inicia un trayecto primero.';
  if (!(Number.isInteger(stop) && stop > b.current && stop <= N)) return 'Solo puedes elegir paradas más adelante.';
  b.target = stop; b.manual = true;
}));
app.post('/api/logout', (req, res) => { delete store.data.sessions[req.token]; delete store.data.buses[req.key]; save(); res.json({ ok: true }); });

setInterval(() => {                                    // retira buses abandonados y sesiones vencidas
  const S = store.data, now = Date.now(); let ch = false;
  for (const [k, b] of Object.entries(S.buses)) if (now - b.updatedAt > STALE_MS) { delete S.buses[k]; ch = true; }
  for (const [t, s] of Object.entries(S.sessions)) if (now - s.at > SESSION_MS) { delete S.sessions[t]; ch = true; }
  if (ch) save();
}, 60e3);

init().then(() => app.listen(PORT, () => console.log(`MiRutaRapidaNorte en puerto ${PORT} (${store.mode})`)))
  .catch(e => { console.error(e); process.exit(1); });
