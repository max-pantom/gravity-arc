# Archive

A visual memory system for builders — mymind's friction + structural intelligence.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What It Is

Archive is a **living idea network**. Not a bucket. Not a wiki.

- **Frictionless capture** — Paste link → OG preview. Paste image → image card. Type → idea or note. No type selector.
- **Rich link cards** — Title, description, image, favicon, domain. Fetched automatically.
- **Visual grid** — Masonry layout. Images large. Links large. Density control (Sparse ←→ Dense).
- **Fast filter** — Instant. By type, domain, status. No separate data page.
- **Cognitive engine** — Now, Resurfacing, Clusters. The system decides what you see.

## Capture Behavior

| Paste / Input | Result |
|---------------|--------|
| URL only | Link card with OG metadata |
| Image | Image card |
| Short text (< 140 chars) | Idea |
| Long text | Note |
| Checklist pattern | Project |

## Linking

Type `[[` to link. Search by title, pick or create. Hover for preview.

## Dev Mode

`Cmd+Shift+D` — Raw JSON, logs. Surface stays clean.

## Tech

- Next.js 16, React 19, Tailwind 4
- IndexedDB (local-first)
- Electron (desktop wrapper)

## Roadmap

- **v1.5** — Graph morph on spacebar, energy glow
- **v2** — SQLite, optional sync, semantic search
