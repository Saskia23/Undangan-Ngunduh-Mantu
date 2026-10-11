const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });

export async function onRequest({ request, env }) {
  const db = env.DB;
  const eventKey = String(env.EVENT_KEY || 'ngunduh-mantu').slice(0, 80);
  if (!db) return json({ error: 'Database RSVP belum dihubungkan.' }, 503);

  if (request.method === 'GET') {
    try {
      const { results = [] } = await db.prepare(
        'SELECT name, status, count, msg, ts FROM rsvp_wishes WHERE event_key = ? ORDER BY ts DESC, id DESC LIMIT 500'
      ).bind(eventKey).all();
      return json(results);
    } catch {
      return json({ error: 'Ucapan belum dapat dimuat.' }, 503);
    }
  }
  if (request.method !== 'POST') return json({ error: 'Metode tidak didukung.' }, 405);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'Content-Type harus application/json.' }, 415);

  let input;
  try { input = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }
  const name = String(input?.name ?? '').trim();
  const status = String(input?.status ?? '');
  const count = Number(input?.count ?? 0);
  const msg = String(input?.msg ?? '').trim();
  const ts = Number(input?.ts) || Date.now();
  if (!name || name.length > 100 || !['Hadir', 'Tidak'].includes(status) || !Number.isInteger(count) || count < 0 || count > 20 || !msg || msg.length > 1000) {
    return json({ error: 'Mohon periksa nama, kehadiran, jumlah tamu, dan ucapan.' }, 422);
  }

  try {
    await db.prepare('INSERT INTO rsvp_wishes (event_key, name, status, count, msg, ts) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(eventKey, name, status, count, msg, ts).run();
    await db.prepare('DELETE FROM rsvp_wishes WHERE event_key = ? AND id NOT IN (SELECT id FROM rsvp_wishes WHERE event_key = ? ORDER BY ts DESC, id DESC LIMIT 500)')
      .bind(eventKey, eventKey).run();
    const { results = [] } = await db.prepare('SELECT name, status, count, msg, ts FROM rsvp_wishes WHERE event_key = ? ORDER BY ts DESC, id DESC LIMIT 500')
      .bind(eventKey).all();
    const entry = results.find(item => item.ts === ts && item.name === name && item.msg === msg) || { name, status, count, msg, ts };
    return json({ ok: true, entry }, 201);
  } catch {
    return json({ error: 'Ucapan belum dapat disimpan. Silakan coba lagi.' }, 503);
  }
}
