# Agora Test Data Generator

Static website that generates realistic, non-duplicating dummy data for testing
Agora forms. Rebuild of the original vanilla-JS tool using Vite + React + TypeScript.

## Record types
Parent, Student/Child, Course, Course Instance, Class, Product, Update Message, Ticket.

## Features
- Seeded reproducibility (blank seed = random)
- Guaranteed no duplicates within a batch
- Text length modes: Normal / Long / Stress
- Singapore-realistic names, phones, postcodes
- Export to JSON / CSV, click-to-copy, HTML preview for messages/tickets
- Dark mode, keyboard shortcuts 1–8

## Develop
```bash
npm install
npm run dev
npm test
npm run build
```

## Deploy
Pushing to `main` builds and publishes to GitHub Pages via GitHub Actions.
Set **Settings → Pages → Source → GitHub Actions** once, after the first push.
