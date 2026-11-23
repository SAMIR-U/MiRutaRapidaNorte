const $ = id => document.getElementById(id);
let token = localStorage.token, st = null, sel = null, busy = false, skew = 0, got = 0, down = false;
const setState = j => { st = j; skew = j.now - Date.now(); got = Date.now(); };   // reloj local sincronizado con el servidor
const nowS = () => Date.now() + skew;
const liveWait = s => Math.max(0, s.wait - s.atStop * (Date.now() - got) / 1000);  // la espera baja 1 s por segundo
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const col = w => (w < 30 ? 'var(--ok)' : w < 100 ? 'var(--mid)' : 'var(--bad)');

// ---------- API ----------
async function api(p, body) {
  const r = await fetch('/api/' + p, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json();
  if (r.status === 401) { logout(); throw new Error(j.error); }
  if (!r.ok) throw new Error(j.error);
  return j;
}
async function refresh() { if (!token || busy) return; try { setState(await api('state')); draw(); } catch {} }
async function doit(p, body) {
  busy = true;
  try { setState(await api(p, body)); if (p === 'target') sel = null; draw(); } catch (x) { alert(x.message); }
  busy = false;
}

// ---------- Sesión ----------
function logout() { delete localStorage.token; token = null; st = null; $('app').hidden = true; $('login').hidden = false; }
function start() { $('login').hidden = true; $('app').hidden = false; $('hRuta').textContent = 'Ruta ' + localStorage.ruta; refresh(); }
$('login').onsubmit = async e => {
  e.preventDefault(); $('err').textContent = '';
  try {
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: $('name').value, password: $('pw').value, ruta: $('ruta').value }),
    });
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    token = localStorage.token = j.token; localStorage.ruta = $('ruta').value; $('pw').value = ''; start();
  } catch (x) { $('err').textContent = x.message; }
};
$('out').onclick = async () => { try { await api('logout', {}); } catch {} logout(); };

// ---------- Mapa ----------
const X0 = 80, W = 300, H = 440;            // zona del viewBox (440 x 640) que ocupan los nodos
const SEG0 = 60;                             // s (solo visual): Glorieta -> parada 1
const SHORT = { 8: 'Decorcerámica', 9: 'Campus Uniboyacá' };   // nombres cortos para el mapa
const TAG = {
  dest: ['Destino', 'var(--bus)', 'var(--ink)'],
  sug: ['Sugerida', '#1a56db', '#fff'],
  skip: ['Saltar', '#5d6f7b', '#fff'],
};
const mapName = s => SHORT[s.id] || (s.name.length > 15 ? s.name.slice(0, 14) + '…' : s.name);

// Devuelve los puntos [0..N] (0 = Glorieta virtual, antes de la parada 1)
function project(stops) {
  const [s1, s2] = stops, k = Math.cos(5.55 * Math.PI / 180);
  const all = [{ lat: s1.lat + (s1.lat - s2.lat) * 0.9, lng: s1.lng + (s1.lng - s2.lng) * 0.9 }, ...stops];
  const la = all.map(s => s.lat), lo = all.map(s => s.lng);
  const [a0, a1, o0, o1] = [Math.min(...la), Math.max(...la), Math.min(...lo), Math.max(...lo)];
  const sc = Math.min(W / ((o1 - o0) * k), H / (a1 - a0)), top = (640 - (a1 - a0) * sc) / 2;
  return all.map(s => ({ x: X0 + (s.lng - o0) * k * sc, y: top + (a1 - s.lat) * sc }));
}
const f1 = n => n.toFixed(1);
const poly = (pts, i, j) => pts.slice(i, j + 1).map(p => f1(p.x) + ',' + f1(p.y)).join(' ');

// Punto a `secs` segundos de camino desde la parada `from` rumbo a `to`
function along(pts, segT, from, to, secs) {
  for (let k = from; k < to; k++) {
    const t = segT(k);
    if (secs <= t || k === to - 1) { const f = Math.min(0.6, Math.max(0.4, secs / t)); return { x: pts[k].x + (pts[k + 1].x - pts[k].x) * f, y: pts[k].y + (pts[k + 1].y - pts[k].y) * f }; }
    secs -= t;
  }
  return pts[from];
}

// Logo del conductor: bus de frente + leyenda "Tú"
const busMark = (x, y) => `<g class="me" transform="translate(${f1(x)} ${f1(y)})" pointer-events="none" role="img" aria-label="Tú">
  <circle r="15" fill="#fff" stroke="var(--ink)" stroke-width="2"/>
  <use href="#busFront" x="-12" y="-12" width="24" height="24"/>
  <rect x="-13" y="14" width="26" height="14" rx="7" fill="var(--ink)"/>
  <text y="24.5" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">Tú</text></g>`;

// Etiqueta de estado: rectángulo + texto (ancho estimado). `right` = borde derecho en vez del izquierdo
function chip(x, y, str, fill, color, h, right, cls) {
  const w = str.length * 6.3 + 12, x0 = right ? x - w : x;
  return { w, svg: `<rect x="${f1(x0)}" y="${y}" width="${f1(w)}" height="${h}" rx="${h / 2}" fill="${fill}"/><text class="${cls}" x="${f1(x0 + w / 2)}" y="${y + h - 3.5}" text-anchor="middle" fill="${color}">${str}</text>` };
}

function draw() {
  const b = st.me.bus, m = st.me, cur = b ? b.current : -1, N = st.stops.length, pts = project(st.stops);
  const S = id => st.stops.find(s => s.id === id), segT = i => (i === 0 ? SEG0 : S(i).next);
  $('hInfo').textContent = st.active + (st.active === 1 ? ' bus activo' : ' buses activos');

  // --- qué se marca en el mapa ---
  const enRuta = b && b.status === 'enRuta', tgt = enRuta ? b.target : null;
  const sug = b && b.current < N && m.suggest > b.current ? m.suggest : null;
  const preview = sug && sug !== tgt ? sug : null;              // recomendación aún no aceptada (punteada)
  const tags = {};                                               // id -> 'dest' | 'sug' | 'skip'
  const skipTo = to => { for (let k = b.current + 1; k < to; k++) if (!tags[k]) tags[k] = 'skip'; };
  if (b) { if (tgt) tags[tgt] = 'dest'; if (preview) tags[preview] = 'sug'; if (tgt) skipTo(tgt); if (preview) skipTo(preview); }

  let g = `<polyline class="road" points="${poly(pts, 0, N)}"/>`;
  if (tgt) g += `<polyline class="route" points="${poly(pts, b.current, tgt)}"/>`;
  if (preview) g += `<polyline class="sugg" points="${poly(pts, b.current, preview)}"/>`;
  g += `<circle cx="${f1(pts[0].x)}" cy="${f1(pts[0].y)}" r="6" fill="#fff" stroke="#5d6f7b" stroke-width="2.5"/><text class="glo" x="${f1(pts[0].x + 12)}" y="${f1(pts[0].y + 4)}">Glorieta</text>`;

  for (const s of st.stops) {
    const { x, y } = pts[s.id], mine = b && (b.current === s.id || b.target === s.id), isSel = sel === s.id, left = x > 300;
    const wt = liveWait(s), c = col(wt), tag = tags[s.id], parts = [];
    if (s.atStop) parts.push(s.atStop + ' aquí'); if (s.heading) parts.push(s.heading + ' en ruta');
    // fila 1: nombre + etiqueta de estado; fila 2: espera (color según nivel) + buses
    const nm = mapName(s), nmW = nm.length * 6.7, ax = left ? x - 22 : x + 22;
    let row1 = `<text class="lbl${mine ? ' mine' : ''}" x="${f1(ax)}" y="${f1(y - 3)}" text-anchor="${left ? 'end' : 'start'}">${nm}</text>`;
    if (tag) { const [t, bg, fg] = TAG[tag]; row1 += chip(left ? ax - nmW - 6 : ax + nmW + 6, y - 14, t, bg, fg, 14, left, 'chip').svg; }
    const pl = chip(ax, y + 2, fmt(wt), c, wt >= 30 && wt < 100 ? 'var(--ink)' : '#fff', 13, left, 'chip');
    let row2 = pl.svg;
    if (parts.length) row2 += `<text class="cnt" x="${f1(left ? ax - pl.w - 5 : ax + pl.w + 5)}" y="${f1(y + 12.5)}" text-anchor="${left ? 'end' : 'start'}">${parts.join(' · ')}</text>`;
    g += `<g class="node" data-id="${s.id}" tabindex="0" role="button" aria-label="Parada ${s.id} ${s.name}, espera ${fmt(wt)}${tag ? ', ' + TAG[tag][0] : ''}"><title>${s.name}</title>
      ${tgt === s.id ? `<circle class="pulse" cx="${f1(x)}" cy="${f1(y)}" r="15" fill="none" stroke="var(--bus)" stroke-width="3"/>` : ''}
      ${tag === 'sug' ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="20" fill="none" stroke="#1a56db" stroke-width="3" stroke-dasharray="5 4"/>` : ''}
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${isSel ? 17 : 14}" fill="${c}" stroke="${isSel ? 'var(--ink)' : '#fff'}" stroke-width="${isSel ? 4 : 3}"${tag === 'skip' ? ' opacity=".55"' : ''}/>
      <text x="${f1(x)}" y="${f1(y + 4.5)}" text-anchor="middle" font-weight="700" fill="${c === 'var(--mid)' ? 'var(--ink)' : '#fff'}" font-size="13">${s.id}</text>
      ${row1}${row2}</g>`;
  }

  // --- logo del conductor ---
  if (b && b.status === 'enParada') {                            // en una estación: al lado del nodo
    const p = pts[b.current], left = p.x > 300;
    g += busMark(left ? p.x + 34 : p.x - 34, p.y - 4);
  } else if (enRuta) {                                           // en trayecto: entre los nodos
    let T = 0; for (let k = b.current; k < b.target; k++) T += segT(k);
    const el = b.departedAt ? (nowS() - b.departedAt) / 1000 : T / 2;
    const p = along(pts, segT, b.current, b.target, Math.max(0, el));
    g += busMark(p.x, p.y);
  }

  // --- leyenda de colores de espera ---
  g += [['var(--ok)', 'poca espera', 80], ['var(--mid)', 'media', 190], ['var(--bad)', 'mucha', 260]]
    .map(([c, t, lx]) => `<circle cx="${lx}" cy="618" r="6" fill="${c}"/><text class="leg" x="${lx + 11}" y="622">${t}</text>`).join('');

  $('scene').innerHTML = g;
  panel();
}
const pick = e => { const n = e.target.closest('.node'); if (n) { sel = +n.dataset.id; draw(); } };
$('map').addEventListener('click', pick);
$('map').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });

// ---------- Panel ----------
function panel() {
  const m = st.me, b = m.bus, S = id => st.stops.find(s => s.id === id), nm = id => `Parada ${id} · ${S(id).name}`;
  const last = st.stops.length;
  let h = '';
  if (!b) {
    h = `<h2>Sin trayecto activo</h2><div class="sub">Sal desde la Glorieta del Gobernador. El sistema te asigna la primera parada.</div><button class="alt" data-act="start">Iniciar trayecto</button>`;
  } else {
    if (b.status === 'enRuta') {
      h += `<h2>En ruta a ${nm(b.target)}</h2><div class="sub">Llegada estimada <span class="t">${fmt(m.etas[b.target])}</span> (incluye espera en la parada)</div>`;
    } else {
      const el = (nowS() - b.arrivedAt) / 1000;
      h += `<h2>En ${nm(b.current)}</h2><div class="sub">Llevas <span class="t">${fmt(el)}</span> · te quedan <span class="t">${fmt(Math.max(0, 120 - el))}</span> de turno de espera</div>`;
    }
    if (b.current < last) {
      const next = m.suggest, skip = m.skipped.map(i => S(i).name).join(', ');
      if (b.status === 'enRuta' && next !== b.target && next > b.current)
        h += `<div class="alert"><div>Recomendado (Dijkstra): ir a <b>${nm(next)}</b>${skip ? ', saltando ' + skip : ''}. Hay mucha espera en ${nm(b.target)}. Está marcada en el mapa con línea punteada.</div><button class="alt" data-act="target" data-stop="${next}">Aceptar recomendación</button></div>`;
      else if (b.status === 'enParada')
        h += `<div class="${skip ? 'alert' : 'sub'}">Siguiente recomendada: <b>${nm(next)}</b>${skip ? ' (se salta ' + skip + ' por congestión)' : ''}.</div>`;
      h += `<div class="sub">Ruta óptima: ${m.plan.join(' → ')}</div>`;
    }
    h += b.status === 'enRuta'
      ? `<button class="alt" data-act="arrive">Llegué a la parada</button>`
      : `<button class="alt" data-act="depart">${b.current === last ? 'Terminar trayecto' : 'Salí de la parada'}</button>`;
  }
  if (sel) {
    const s = S(sel), ok = b && sel > b.current, e = ok ? m.etas[sel] : null;
    h += `<hr><h2>${nm(sel)}</h2>
      <div class="row"><div><div class="sub">Espera en parada</div><div class="t">${fmt(liveWait(s))}</div></div><div><div class="sub">Tu llegada estimada</div><div class="t">${e == null ? '—' : fmt(e)}</div></div></div>
      <button class="ghost" ${ok && b.target !== sel ? '' : 'disabled'} data-act="target" data-stop="${sel}">${b && b.target === sel ? 'Es tu destino actual' : 'Ir a esta parada'}</button>`;
  }
  $('panel').innerHTML = h;
}
$('panel').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]'); if (!btn) return;
  doit(btn.dataset.act, btn.dataset.act === 'target' ? { stop: +btn.dataset.stop } : {});
});

if (token) start();
setInterval(refresh, 3000);                                   // sincroniza con el servidor
addEventListener('pointerdown', () => { down = true; }, true);
addEventListener('pointerup', () => { down = false; }, true);
addEventListener('pointercancel', () => { down = false; }, true);
setInterval(() => { if (st && !down) draw(); }, 1000);        // los temporizadores avanzan de 1 en 1