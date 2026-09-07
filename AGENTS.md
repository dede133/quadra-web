# Quadra

Quadra is a small, mobile-first web app for choosing a football match time from group availability. The current scope ends at creating a plan, collecting responses, ranking slots, and confirming one slot. Do not add accounts, venues, bookings, notifications, or unrelated product features.

- Stack: Next.js App Router, strict TypeScript, Tailwind, Supabase PostgreSQL accessed only from server code.
- Keep browser components focused on interaction; database access stays in `src/server/` via the server-only Supabase client.
- Domain types are in `src/domain/plan/`. The pure `src/domain/consensus/` engine must not know about football, React, Next.js, or Supabase.
- Keep dependencies and abstractions small. Prefer clear local code over generic frameworks.
- Design mobile-first and preserve basic keyboard/accessibility behavior.
- Apply SQL changes as new files in `supabase/migrations/`; never expose service-role credentials.
- Before completing work run: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
