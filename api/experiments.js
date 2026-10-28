const CAT = ['pod-failure', 'network-latency', 'cpu-stress', 'disk-io', 'ebpf-attack-sim', 'chaos-sweep'], audit = [];
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.json({ catalog: CAT, audit: audit.slice(-20) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const b = req.body || {}, id = Number(b.id), blast = Math.min(50, Math.max(1, Number(b.blast) || 10));
  if (!Number.isInteger(id) || id < 0 || id > 5) return res.status(400).json({ error: 'invalid experiment' });
  const r = { runId: 'run-' + Date.now().toString(36), experiment: CAT[id], blast, status: 'simulated', mttrSeconds: Math.round(8 + Math.random() * 80), guardrail: blast > 25 ? 'approval-required' : 'auto-approved', at: new Date().toISOString() };
  audit.push(r); res.status(201).json(r);
};
