// Persistencia: Postgres si existe DATABASE_URL; si no, archivo JSON (data/state.json).
// Nota: en Render gratis el disco es efímero; usa DATABASE_URL para conservar el estado.
const fs = require('fs'), path = require('path');
const FILE = process.env.STATE_FILE || path.join(__dirname, '..', 'data', 'state.json');
const store = { data: { users: {}, sessions: {}, buses: {} }, mode: 'JSON' };
let pool, timer;

async function init() {
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg'), url = process.env.DATABASE_URL;
    pool = new Pool({ connectionString: url, ssl: /\.render\.com/.test(url) ? { rejectUnauthorized: false } : undefined });
    await pool.query('create table if not exists app_state(id int primary key, data jsonb not null)');
    const r = await pool.query('select data from app_state where id=1');
    if (r.rows[0]) store.data = r.rows[0].data;
    store.mode = 'Postgres';
  } else {
    try { store.data = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { /* primer arranque */ }
  }
}
function save() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      if (pool) await pool.query('insert into app_state values(1,$1) on conflict(id) do update set data=$1', [store.data]);
      else { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(store.data, null, 1)); }
    } catch (e) { console.error('save:', e.message); }
  }, 300);
}
module.exports = { store, init, save };
