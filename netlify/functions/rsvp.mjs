import { getStore } from '@netlify/blobs';

const store = getStore('saskia-regi-guestbook');
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export default async (request) => {
  try {
    if (request.method === 'GET') {
      const { blobs } = await store.list({ prefix: 'wish/' });
      const items = await Promise.all(blobs.map(({ key }) => store.get(key, { type: 'json' })));
      return json(items.filter(Boolean).sort((a, b) => b.ts - a.ts).slice(0, 500));
    }

    if (request.method !== 'POST') return json({ error: 'Metode tidak didukung.' }, 405);
    const input = await request.json();
    const name = String(input.name ?? '').trim();
    const status = String(input.status ?? '');
    const count = Number(input.count ?? 0);
    const msg = String(input.msg ?? '').trim();
    if (!name || name.length > 100 || !['Hadir', 'Tidak'].includes(status) || !Number.isInteger(count) || count < 0 || count > 20 || !msg || msg.length > 1000) {
      return json({ error: 'Mohon periksa nama, kehadiran, jumlah tamu, dan ucapan.' }, 422);
    }

    const entry = { name, status, count, msg, ts: Date.now() };
    await store.setJSON(`wish/${entry.ts}-${crypto.randomUUID()}`, entry);
    return json({ ok: true, entry }, 201);
  } catch (error) {
    console.error('RSVP storage error:', error);
    return json({ error: 'Ucapan belum dapat disimpan. Silakan coba lagi.' }, 500);
  }
};
