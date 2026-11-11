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
- Because the repo is public: never commit secrets. `.env` is gitignored; only the Supabase **publishable** key (formerly "anon") is used client-side, and security relies entirely on correct **RLS policies** on every table. Never use or commit the secret key (formerly "service role").

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
  stores/          Pinia stores (auth.ts, children.ts)
  router/          Routes + auth guard
  views/           LoginView, ProfilesView, ChildLayout (nav shell), ChildView (chore list), SettingsView
  components/      BottomNav, ChildFormModal, ChoreFormModal
  supabase/migrations/  SQL schema (0001_init.sql), run manually in the Supabase SQL Editor
```

## Current status

- Supabase project exists; `.env` (gitignored) has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Login works; user account created.
- Schema in `supabase/migrations/0001_init.sql` (children, chores, payouts, chore_logs + RLS) and `0002_grants.sql` (GRANTs to `authenticated`; new Supabase projects don't auto-grant, so every new table needs a GRANT too) have been run in the dashboard. Money is `numeric(10,2)`; `chore_logs.amount` / `payouts.amount` are snapshots; chores are archived (`archived`) instead of deleted; balance = `sum(amount * delta)` over logs with `payout_id is null`.
- Profile picker done: Netflix-style grid, "Add child" modal, "Manage" mode with pencil to edit/delete (`ProfilesView`, `ChildFormModal`, `stores/children.ts`). Colors from `lib/palette.ts`; no avatar images yet (initial letter).
- Child view: mobile-first one-row chore list (minus left, icon with price label, name, plus right; all controls 40px). No header: the earned total lives in the bottom nav's coin tab (`EarnedCounter`: counts up + bumps; coin sounds from `lib/sound.ts`, synthesized with Web Audio, toggle under Settings, stored in localStorage; flying coins deliberately skipped for now). No count, no highlight on the list; minus is disabled at 0 per chore. Every tap = one `chore_logs` row; minus reuses the price snapshot of the latest plus. Chores are shared by all children. Files: `ChildView`, `stores/chores.ts`, `stores/chorelogs.ts` (logs are fetched with `created_at` and a joined `chores(name, icon, color)`), `ChoreFormModal`, `lib/icons.ts` (curated Lucide set), `lib/format.ts` (kr), `_pickers.scss`.
- Live at https://jezperp.github.io/weekpay/ (GitHub Pages via `.github/workflows/deploy.yml`, deploys on every push to main). Verified working by the user. All commits are pushed.
- Open sign-ups are disabled in Supabase.
- Bottom nav is built: `ChildLayout` (loads the child's logs for the nav) + `BottomNav` (Home, Payout [`PayoutView`: to-pay amount, "Mark as paid" with confirm modal, earlier payouts that expand to per-chore detail], child avatar = chore list, Earned [live total; links to `EarnedView`: per-chore breakdown + log grouped by day, unpaid logs only], Settings). `SettingsView` (`/child/:id/settings`) holds chore add/edit/archive, child edit/delete and sign out; the old Manage mode on the chore list is gone; also holds the sound toggle and theme (System/Light/Dark via `lib/theme.ts`, `data-bs-theme`, inline script in `index.html` avoids a flash). The tab/page was renamed Manage -> Settings. Payout calls the Postgres function `pay_out(child_id)` (migration `0003_pay_out_function.sql`, SECURITY INVOKER so RLS applies, atomic; **must be run in the dashboard**). Always pays out the whole unpaid balance; no period picker or custom amounts by design.

## Next steps

No planned work left; the core flow (profiles, chores, earn, payout, history, settings, sv/en, dark mode) is live. Ideas to discuss with the user:

- Flying-coin animation on tap; undo/delete single log entries from the Earned log.
- Avatar images/emoji for children; per-child chores (chores are shared today).
- PWA / "add to home screen" icon and offline support.
- Custom domain or move to Vercel (then `base: '/'`).

- Chores have an optional `description` (max 200 chars; migration `0005_chore_description.sql`, **must be run in the dashboard**), shown under the name in the chore list and in Settings with the `.text-fine` helper.

- Chore name + description are single-line with ellipsis in the lists; tapping the text in the chore list opens `ChoreDetailModal` with the full text.

## Decisions

- Name: WeekPay. Lucide for icons. Auth from the start (email/password via Supabase). Hash-mode router for GitHub Pages. GitHub Pages first, maybe Vercel later.
