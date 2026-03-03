# Roy's Cut Tracker

Personal 10-week fat loss tracker. Mobile-first web app.

## Setup

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
gh repo create roy-cut-tracker --public --source=. --remote=origin --push

# Deploy
npx vercel --prod
```

## Stack

- Vite + React + Tailwind CSS v4
- localStorage for persistence
- canvas-confetti for celebrations
- recharts for progress charts
- Web Audio API for synthesized sounds
