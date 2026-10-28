// Server-side OpsAgent proxy: keys stay in Vercel env vars, never in the browser.
const hits = new Map(); let cache = { t: 0, m: null };
const SYS = "You are ChaosLab OpsAgent, an expert SRE chaos-engineering assistant. Be concise. For experiment requests reply with a YAML chaos spec in a code block, a CLI command and a risk note. Never exceed the stated blast radius. Refuse destructive actions outside the sandbox.";
async function models() {
  if (cache.m && Date.now() - cache.t < 36e5) return cache.m;
  const m = {};
  if (process.env.GROQ_API_KEY) try {
    const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY } });
    const ids = (await r.json()).data.map(x => x.id).filter(i => !/whisper|guard|tts|prompt/.test(i));
    m.groq = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant'].find(p => ids.includes(p)) || ids[0];
  } catch {}
  if (process.env.GEMINI_API_KEY) try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models', { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY } });
    const ids = (await r.json()).models.filter(x => (x.supportedGenerationMethods || []).includes('generateContent')).map(x => x.name.replace('models/', '')).filter(n => /gemini/.test(n) && !/(embed|tts|image|live|exp)/.test(n));
    m.gemini = ids.find(n => /flash/.test(n) && !/(lite|8b|preview)/.test(n)) || ids.find(n => /flash/.test(n)) || ids[0];
  } catch {}
  cache = { t: Date.now(), m }; return m;
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const o = process.env.ALLOWED_ORIGIN;
  if (o && req.headers.origin && req.headers.origin !== o) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const ip = (req.headers['x-forwarded-for'] || 'x').split(',')[0].trim(), now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < 6e4); h.push(now); hits.set(ip, h);
  if (h.length > 20) return res.status(429).json({ error: 'rate limit: 20/min' });
  const b = req.body || {};
  if (typeof b.message !== 'string' || !b.message.trim() || b.message.length > 2000) return res.status(400).json({ error: 'invalid message' });
  const hist = (Array.isArray(b.history) ? b.history : []).slice(-8).filter(x => x && ['user', 'assistant'].includes(x.role) && typeof x.content === 'string').map(x => ({ role: x.role, content: x.content.slice(0, 2000) }));
  const ctx = (Array.isArray(b.context) ? b.context : []).slice(0, 3).map(s => String(s).slice(0, 400)).join('\n');
  const sys = SYS + '\nRunbook context:\n' + ctx + '\nBlast radius: ' + Math.min(50, Math.max(1, +b.blast || 10)) + '%';
  const m = await models();
  if (m.groq) try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.GROQ_API_KEY }, body: JSON.stringify({ model: m.groq, temperature: .4, messages: [{ role: 'system', content: sys }, ...hist, { role: 'user', content: b.message }] }) });
    if (r.ok) return res.json({ reply: (await r.json()).choices[0].message.content, provider: 'groq', model: m.groq });
  } catch {}
  if (m.gemini) try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m.gemini}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: [...hist, { role: 'user', content: b.message }].map(x => ({ role: x.role === 'user' ? 'user' : 'model', parts: [{ text: x.content }] })) }) });
    if (r.ok) return res.json({ reply: (await r.json()).candidates[0].content.parts[0].text, provider: 'gemini', model: m.gemini });
  } catch {}
  res.status(502).json({ error: 'no provider available' });
};
