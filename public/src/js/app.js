const $ = id => document.getElementById(id);
let token = localStorage.token, st = null, sel = null, busy = false;
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
async function refresh() { if (!token || busy) return; try { st = await api('state'); draw(); } catch {} }
async function doit(p, body) {
  busy = true;
  try { st = await api(p, body); if (p === 'target') sel = null; draw(); } catch (x) { alert(x.message); }
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

// ---------- Mapa: solo nodos ----------
function project(stops) {
  const la = stops.map(s => s.lat), lo = stops.map(s => s.lng), k = Math.cos(5.55 * Math.PI / 180);
  const [a0, a1, o0, o1] = [Math.min(...la), Math.max(...la), Math.min(...lo), Math.max(...lo)];
  const sc = Math.min(300 / ((o1 - o0) * k), 540 / (a1 - a0));
  return s => ({ x: 40 + (s.lng - o0) * k * sc, y: 590 - (s.lat - a0) * sc });
}
function draw() {
  const b = st.me.bus, cur = b ? b.current : -1, pos = project(st.stops);
  $('hInfo').textContent = st.active + (st.active === 1 ? ' bus activo' : ' buses activos');
  let g = '';
  for (const s of st.stops) {
    const { x, y } = pos(s), mine = b && (b.current === s.id || b.target === s.id), isSel = sel === s.id;
    g += `<g class="node" data-id="${s.id}" tabindex="0" role="button" aria-label="Parada ${s.id} ${s.name}">
      ${b && b.target === s.id && b.status === 'enRuta' ? `<circle class="pulse" cx="${x}" cy="${y}" r="18" fill="none" stroke="var(--bus)" stroke-width="3"/>` : ''}
      <circle cx="${x}" cy="${y}" r="${isSel ? 20 : 17}" fill="${col(s.wait)}" stroke="${isSel ? 'var(--ink)' : '#fff'}" stroke-width="${isSel ? 4 : 3}"/>
      <text x="${x}" y="${y + 5}" text-anchor="middle" font-weight="700" fill="#fff" font-size="15">${s.id}</text>
      <text x="${x + 26}" y="${y - 2}" font-size="14" font-weight="${mine ? 700 : 500}" fill="var(--ink)">${s.name + (s.id === cur ? ' · aquí' : '')}</text>
      <text x="${x + 26}" y="${y + 14}" font-size="12.5" fill="var(--mute)">espera ${fmt(s.wait)} · ${s.atStop} en parada${s.heading ? ' · ' + s.heading + ' llegando' : ''}</text></g>`;
  }
  $('map').innerHTML = g;
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
      const el = (st.now - b.arrivedAt) / 1000;
      h += `<h2>En ${nm(b.current)}</h2><div class="sub">Llevas <span class="t">${fmt(el)}</span> · te quedan <span class="t">${fmt(Math.max(0, 120 - el))}</span> de turno de espera</div>`;
    }
    if (b.current < last) {
      const next = m.suggest, skip = m.skipped.map(i => S(i).name).join(', ');
      if (b.status === 'enRuta' && next !== b.target && next > b.current)
        h += `<div class="alert"><div>Recomendado (Dijkstra): ir a <b>${nm(next)}</b>${skip ? ', saltando ' + skip : ''}. Hay mucha espera en ${nm(b.target)}.</div><button class="alt" data-act="target" data-stop="${next}">Aceptar recomendación</button></div>`;
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
      <div class="row"><div><div class="sub">Espera en parada</div><div class="t">${fmt(s.wait)}</div></div><div><div class="sub">Tu llegada estimada</div><div class="t">${e == null ? '—' : fmt(e)}</div></div></div>
      <button class="ghost" ${ok && b.target !== sel ? '' : 'disabled'} data-act="target" data-stop="${sel}">${b && b.target === sel ? 'Es tu destino actual' : 'Ir a esta parada'}</button>`;
  }
  $('panel').innerHTML = h;
}
$('panel').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]'); if (!btn) return;
  doit(btn.dataset.act, btn.dataset.act === 'target' ? { stop: +btn.dataset.stop } : {});
});

if (token) start();
setInterval(refresh, 3000);
