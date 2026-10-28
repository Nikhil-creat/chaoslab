module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4'); res.setHeader('Cache-Control', 'no-store');
  res.send(`# HELP chaoslab_up Service up\n# TYPE chaoslab_up gauge\nchaoslab_up 1\n# TYPE chaoslab_process_uptime_seconds gauge\nchaoslab_process_uptime_seconds ${process.uptime().toFixed(0)}\n# TYPE chaoslab_providers gauge\nchaoslab_providers{provider="groq"} ${process.env.GROQ_API_KEY ? 1 : 0}\nchaoslab_providers{provider="gemini"} ${process.env.GEMINI_API_KEY ? 1 : 0}\n`);
};
