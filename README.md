# CollabNote

A collaborative workspace that combines real-time document editing with spatial
thinking tools — canvases, decision logs and knowledge maps — so a team's notes,
reasoning and diagrams live in one place instead of three apps.

## Features

- **Real-time collaboration** — concurrent editing over Yjs CRDTs and WebSockets.
  No lock contention; edits merge without a central arbiter.
- **Thinking Canvas** — a spatial surface (React Flow) for brainstorming and
  diagramming alongside the document.
- **Decision Log** — records decisions with their context, so the *why* survives
  after the discussion scrolls away.
- **Knowledge Map** — a force-directed graph of how documents relate.
- **AI assistance** — Gemini-backed summarising and drafting.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, TypeScript |
| Realtime | Yjs, y-websocket |
| Canvas / graph | React Flow, react-force-graph-2d |
| Backend | Express, Supabase (Postgres) |
| AI | Google Gemini (`@google/genai`) |

## Getting started

**Prerequisites:** Node.js 20+, a Supabase project, a Gemini API key.

```bash
git clone https://github.com/ieeecsopen/collabnote
cd collabnote
npm install
```

Create `.env` in the project root:

```ini
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_KEY=<anon/publishable key>
VITE_API_URL=http://localhost:3001
VITE_COLLABORATION_WS_URL=ws://localhost:1234
```

Create `server/.env` for the backend:

```ini
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=<postgres connection string>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<anon key>
SUPABASE_SERVICE_KEY=<service-role key - server only, never expose>
GEMINI_API_KEY=<gemini key>
JWT_ACCESS_SECRET=<random 32+ char string>
JWT_REFRESH_SECRET=<different random 32+ char string>
```

> **Never commit either file.** `SUPABASE_SERVICE_KEY` bypasses every row-level
> security policy, and the JWT secrets let anyone mint valid sessions. Both are
> gitignored — keep it that way.

```bash
npm run dev      # frontend
npm run build
npm run preview
```

## Project layout

```
components/   React components
contexts/     React context providers (auth, workspace)
hooks/        Shared hooks
services/     API and Supabase clients
server/       Express backend (separate .env)
```

## Contributing

See [CONTRIBUTING.md](https://github.com/ieeecsopen/.github/blob/main/CONTRIBUTING.md).
Open an issue before starting anything substantial.

Good areas to help with: offline/reconnect handling for the Yjs provider,
accessibility on the canvas, and test coverage — there is very little today.

## Licence

MIT — see [LICENSE](LICENSE).
