# WeekPay – agent guide

Kids earn their weekly allowance by doing chores. Parent picks a child (Netflix-style profile picker), taps +/– on chores, and later pays out or resets the balance. Personal family use first, possible public launch later.

## How to work in this project (READ FIRST)

1. **Start of session:** read this file, especially "Current status" and "Next steps", then run `git status` and `git log --oneline -10`. Continue from where the last agent stopped. Don't re-ask decisions already recorded here.
2. **During work:** follow the conventions below. List what you intend to do and get an OK before executing.
3. **End of session / when wrapping up a step:** update "Current status", "Next steps" and "Decisions" in this file so the next agent can pick up seamlessly. Keep it short and factual. Do this every time, even if the user doesn't ask.
4. Never commit or push without explicit approval for that specific action. Commit messages in English.
5. Never run `npm run dev` for the user (they run it themselves). Only run `npm run build` when wrapping up, not after every small edit.

## Stack

- Vue 3 + TypeScript (Vite), Vue Router (hash history), Pinia
- Supabase (Auth + Postgres with Row Level Security)
- Bootstrap 5 via Sass source (not CDN) + own SCSS partials
- Icons: Lucide (`lucide-vue-next`)
- Deploy: GitHub Pages for now (`base: '/weekpay/'` in `vite.config.ts`); may move to Vercel later (then set `base: '/'`)

## Repo

- GitHub: `jezperp/weekpay` (**public**, personal account – not the company org)
- Local git identity is set per-repo: Jesper Pettersson `<jezperp@gmail.com>`. Don't change global git config.
- Because the repo is public: never commit secrets. `.env` is gitignored; only the Supabase **anon** key is used client-side, and security relies entirely on correct **RLS policies** on every table. Never use or commit the service role key.

## Conventions

- Maximize Bootstrap classes, minimize custom CSS.
- **No CSS in Vue `<style>` blocks.** Use SCSS partials in `src/assets/styles/` (imported in `main.scss`), nested BEM (`&__element`, `&--modifier`).
- Use semantic HTML (`h1`–`h6`, `p`, …) with global type styles in `_type.scss`; use helper classes (e.g. `<h3 class="h2">`) instead of new typography classes. Scope component overrides to the parent BEM block.
- Bootstrap variable overrides go in `_variables.scss`.
- Look and feel: extremely simple, playful but clean and modern. Kid-friendly, big tap targets.
- Use `@` alias for `src`.
- User communicates in Swedish; reply in Swedish. Code, comments, docs and commits in English.

## Structure

```
src/
  assets/styles/   SCSS partials (main.scss imports Bootstrap + partials)
  lib/supabase.ts  Supabase client
  stores/          Pinia stores (auth.ts so far)
  router/          Routes + auth guard
  views/           LoginView, ProfilesView (placeholder)
  components/      (empty)
```

## Planned data model (draft, not yet created)

- `children` (id, parent_id → auth.users, name, avatar/color)
- `chores` (id, parent_id, name, price, icon (Lucide name), color)
- `chore_logs` (id, child_id, chore_id, amount snapshot, delta +1/-1, created_at, payout_id nullable)
- `payouts` (id, child_id, amount, period start/end, paid_at)
- Payout flow: current balance = sum of unpaid logs. "Mark as paid" / "reset" attaches logs to a payout so the child starts from zero. Period (week/month/custom) is the parent's choice.
- All tables: RLS so a parent only sees their own rows.

## Current status

- Repo created locally (`~/Repos/weekpay`) and on GitHub (public), initial commit pushed (README + .gitignore).
- Scaffolding done and `npm run build` passes: Vite + Vue 3 + TS + Router + Pinia + Bootstrap/Sass + Supabase client + Lucide installed (not yet used).
- Login/sign-up page (email + password) and auth guard exist; `ProfilesView` is a placeholder.
- Scaffolding and CLAUDE.md are committed locally but **not yet pushed** (ask the user before pushing).
- No Supabase project exists yet; user must create it at supabase.com and put URL + anon key in a local `.env` (see `.env.example`). The user registers their own account via the app's sign-up mode; afterwards disable open sign-ups in Supabase while the repo is public.

## Next steps

1. Push the scaffolding commit to GitHub (ask the user for OK first).
2. Supabase schema as SQL migration files in `supabase/migrations/` (tables above + RLS policies).
3. Profile picker (Netflix-style) + add child flow.
4. Child view: chore grid with +/– and running balance.
5. Chore management: add/edit/delete, price, Lucide icon picker, color.
6. Payout: show earned amount, mark as paid / reset, choose period.
7. GitHub Pages deploy via GitHub Actions (Supabase URL/anon key as repo secrets).

## Decisions

- Name: WeekPay. Lucide for icons. Auth from the start (email/password via Supabase). Hash-mode router for GitHub Pages. GitHub Pages first, maybe Vercel later.
