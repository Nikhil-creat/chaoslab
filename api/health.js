module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, providers: [process.env.GROQ_API_KEY && 'groq', process.env.GEMINI_API_KEY && 'gemini'].filter(Boolean), time: new Date().toISOString() });
};
