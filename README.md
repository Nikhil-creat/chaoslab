# ChaosLab v2 — master build
Structure: `public/` (frontend) · `api/` (serverless backend) · `vercel.json` (security headers) · `.env.example`

## 1. Free keys
Groq: console.groq.com/keys · Gemini: aistudio.google.com/apikey

## 2. Push to GitHub (Termux or PC)
1. Create an empty repo `chaoslab` at github.com/new (no README).
2. In the unzipped folder:
```
pkg install git -y        # Termux only
git config --global user.name "Nikhil Chary Sriramoju"
git config --global user.email "you@example.com"
git init && git add . && git commit -m "ChaosLab v2"
git branch -M main
git remote add origin https://github.com/Nikhil-creat/chaoslab.git
git push -u origin main
```
Password prompt = a Personal Access Token (GitHub → Settings → Developer settings → Tokens, `repo` scope).

## 3. Deploy on Vercel
1. vercel.com → Add New → Project → import `chaoslab`.
2. Framework: **Other**. Leave build command empty (vercel.json sets output `public`).
3. Environment Variables: `GROQ_API_KEY`, `GEMINI_API_KEY`, `ALLOWED_ORIGIN` (your final https URL).
4. Deploy. Open `/api/health` — it should list your providers. Then test OpsAgent.
5. Changed a variable? Redeploy. Never commit `.env`; rotate any key you pasted in public.

Local test: `npx vercel dev`.
