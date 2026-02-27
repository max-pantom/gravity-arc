# Archive

External cognition — ideas that collide.

## Quick Start

```bash
# Install dependencies
npm install

# Web (development)
npm run dev

# Web (production)
npm run build && npm start

# Electron (development — run in two terminals)
# Terminal 1:
npm run dev

# Terminal 2:
ELECTRON_DEV=true electron .

# Or use the combined script:
npm run electron:start

# Electron (production)
npm run electron:dev
```

## Features

- **Capture** — Single input, instant card creation. Press Enter to create.
- **Timeline** — Default home. Cards ordered chronologically.
- **Card View** — Focused read/edit. Click to edit, blur or Cmd+Enter to save.
- **Connections** — Type `[[` to link cards. Inline autocomplete: pick existing or create new.
- **Recall** — Related cards appear below after you edit, based on connections.
- **Themes** — ghost, vine, light, dark, void.

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS
- IndexedDB (local-first)
- Electron (desktop)
- motion, Radix UI primitives

## Data

All data is stored locally in IndexedDB. No cloud, no account. Your memory stays on your device.
