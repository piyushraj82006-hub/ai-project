# Run doc

## How to reproduce the uncommitted artifacts

- `.env.local` — copy from the main checkout (`/Users/piyushraj/project/.env.local`). Never record secret values here.
- Dependencies — install with `npm install` (the project uses npm; see `package-lock.json`).
- No build step is required to run the dev server; `vite build` outputs to `dist/` if a production build is needed.

## How to run the server

Start the Vite dev server detached, logging to a thread-local file:

```bash
{ nohup npm run dev -- --port 5173 --strictPort --no-open > ".freebuff/preview-<thread-id>.log" 2>&1 < /dev/null & echo "pid=$!"; disown; }
```

Notes:

- The repo's `vite.config.js` hardcodes `port: 3000` and `open: true`. Port 3000 is normally taken by an unrelated project (`react-scripts` in `~/Documents/Software project/frontend`), so override with `--port 5173 --strictPort` and disable auto-open with `--no-open`.
- Verify the pid is alive after ~5s with `ps -p <pid>`, then confirm the URL answers: `curl -sf http://localhost:5173/`.
- To stop: `kill <pid>`.
