# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Netrise is a single Next.js 16 (App Router) frontend application for creative agencies, closers, and freelancers. The backend is entirely Supabase (hosted BaaS) — there are no local databases, Docker containers, or additional backend services in this repo.

### Environment variables

A `.env.local` file is required with:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (required; app crashes without it)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key (required; app crashes without it)
- `NEXT_PUBLIC_SITE_URL` — optional, defaults to `https://netrise.com`

Placeholder values work for the landing page and static pages but real Supabase credentials are needed for auth flows (login, registration).

### Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Build | `npm run build` |
| Lint | `npm run lint` (ESLint v9 + eslint-config-next) |

### Known pre-existing lint issues

ESLint reports 3 errors related to `react-hooks/set-state-in-effect` in `ThemeContext.tsx`, `LanguageContext.tsx`, and `completar-perfil/page.tsx`, plus 1 unused-var warning in `PhotoDropzone.tsx`. These are pre-existing and not blockers.

### Gotchas

- The Supabase client (`src/lib/supabase/client.ts`) throws at module import time if the env vars are missing — the `.env.local` file must exist before starting the dev server or building.
- The repo uses `package-lock.json` — use **npm** (not pnpm/yarn).
- No test framework is configured; there are no automated tests to run.
- Login flow (sign-in) is stubbed with a console.info message ("no backend yet"); only the sign-up flow calls Supabase.
