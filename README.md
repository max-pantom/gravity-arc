# Archive

A memory graph with temporal gravity.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What It Is

Archive is not a wiki. It is a **cognition engine** — thoughts that gain weight and influence each other.

- **Capture** — Type a thought. Press Enter. Type defines itself: short → Idea, checklist → Project, URL → Link.
- **Now** — Recently created or edited.
- **Resurfacing** — Dormant ideas gaining score through connection overlap.
- **Clusters** — Auto-detected concept groups from the graph.

The engine decides what you see. Not recency alone. Not link count. Cognitive activity.

## Linking

Type `[[` to link. Search by title, pick or create. Content stores IDs; UI displays titles. Hover links for preview.

## Dev Mode

`Cmd+Shift+D` — JSON export, logs, raw data. Surface stays clean.

## Tech

- Next.js 16, React 19, Tailwind 4
- IndexedDB (local-first)
- Electron (desktop wrapper)

## Roadmap

- **v1.5** — Graph morph on spacebar, energy glow
- **v2** — SQLite, optional sync, semantic search
