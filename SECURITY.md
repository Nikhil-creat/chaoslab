# Security model
- API keys live only in Vercel env vars; `/api/chat` is the sole holder (browser BYOK is a dev fallback only).
- Strict CSP, HSTS, nosniff, frame-deny, COOP, Permissions-Policy via `vercel.json`.
- Server validation: POST only, 2000-char cap, history/context trimmed, blast radius clamped 1-50%.
- Rate limit 20 req/min/IP (in-memory, per instance; add Upstash/Vercel KV for global limits).
- Optional `ALLOWED_ORIGIN` pins the API to your domain.
- Chaos experiments in this build are simulated; a real operator must run sandbox-only with RBAC + approval gates.
Report issues: sriramojunikhil66@gmail.com
