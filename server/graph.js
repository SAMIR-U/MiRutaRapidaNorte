// Datos de paradas, modelo de espera y Dijkstra (lógica pura, sin I/O)
const ARRIVAL_WAIT = 120;                              // cada bus que llega aporta 2 min, decrece linealmente
const SKIP_PENALTY = +process.env.SKIP_PENALTY || 45;  // costo (s) por parada omitida (pasajeros perdidos)

// Paradero, nombre, lat, lng, tiempo al siguiente (s)
const STOPS = [
  [1, 'Makro', 5.543589, -73.34944, 60], [2, 'Unicentro', 5.5452351, -73.34843, 95.5],
  [3, 'Oxxo', 5.5477564, -73.3466946, 122.7], [4, 'Santoto', 5.5516327, -73.3458527, 70.9],
  [5, 'Quintas', 5.5539203, -73.3456346, 81.8], [6, 'Viva', 5.5565767, -73.3449766, 122.7],
  [7, 'Bomba Terpel', 5.5598848, -73.3428186, 65.5], [8, 'EDF Decorcerámica', 5.5614643, -73.3412998, 142.0],
  [9, 'Campus deportivo Uniboyacá', 5.5683094, -73.3325548, 0],
].map(([id, name, lat, lng, next]) => ({ id, name, lat, lng, next }));
const N = STOPS.length;
const seg = [0, ...STOPS.map(s => s.next)];            // seg[0] = nodo virtual "Glorieta" -> parada 1
const travel = (i, j) => { let t = 0; for (let k = i; k < j; k++) t += seg[k]; return t; };

// Espera restante (s) por paradero, según los buses que están detenidos en él
function waits(buses, now = Date.now()) {
  const w = Array(N + 1).fill(0);
  for (const b of Object.values(buses))
    if (b.status === 'enParada') w[b.current] += Math.max(0, ARRIVAL_WAIT - (now - b.arrivedAt) / 1000);
  return w;
}

// Grafo dirigido completo: i -> j para todo j > i.
// peso = trayecto(i,j) + espera(j) + penalización por paradas omitidas
function dijkstra(src, w) {
  const d = Array(N + 1).fill(Infinity), prev = Array(N + 1).fill(null), done = [];
  d[src] = 0;
  for (;;) {
    let u = -1;
    for (let i = src; i <= N; i++) if (!done[i] && d[i] < Infinity && (u < 0 || d[i] < d[u])) u = i;
    if (u < 0) break;
    done[u] = true;
    for (let v = u + 1; v <= N; v++) {
      const c = d[u] + travel(u, v) + w[v] + SKIP_PENALTY * (v - u - 1);
      if (c < d[v]) { d[v] = c; prev[v] = u; }
    }
  }
  const path = []; for (let v = N; v !== null; v = prev[v]) path.unshift(v);
  return { d, path };
}
function plan(from, w) {
  const { d, path } = dijkstra(from, w);
  const next = path[1];
  const skipped = []; for (let k = from + 1; k < next; k++) skipped.push(k);
  return { d, path: path.slice(1), next, skipped };
}

module.exports = { STOPS, N, ARRIVAL_WAIT, SKIP_PENALTY, waits, plan };
