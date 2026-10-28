const hits = new Map();
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const o = process.env.ALLOWED_ORIGIN;
  if (o && req.headers.origin && req.headers.origin !== o) return res.status(403).json({ error: 'forbidden' });
  const ip = (req.headers['x-forwarded-for'] || 'x').split(',')[0].trim(), now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < 6e5); h.push(now); hits.set(ip, h);
  if (h.length > 5) return res.status(429).json({ error: 'too many messages, try later' });
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  const c = s => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').trim();
  const name = c(b.name).slice(0, 80), email = c(b.email).slice(0, 120), msg = c(b.message).slice(0, 1000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || msg.length < 5) return res.status(400).json({ error: 'invalid input' });
  if (process.env.SLACK_WEBHOOK_URL) try { await fetch(process.env.SLACK_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: `ChaosLab contact from ${name} (${email}): ${msg}` }) }); } catch {}
  res.json({ ok: true, delivered: !!process.env.SLACK_WEBHOOK_URL });
};
