# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Elovoz is a donation-matching web app (Portuguese-language product) connecting donors to social institutions ("ONGs"): verified ONGs publish what they need right now (category, quantity, urgency, deadline), donors search by category / urgency / location, express interest, and follow institutions to be notified of new needs. Frontend-only SPA backed by Supabase (Postgres + Auth). No PWA and no web push in this version — mobile-first layout only.

Based on the UNINTER "Atividade Extensionista II" proposal; the full spec (RF01–RF11 / RNF01–RNF07) lives in `docs/especificacao-tecnica.md`.

> Deeper docs (Portuguese): `docs/ARCHITECTURE.md` (features + the files each touches) and `docs/SUPABASE.md` (tables, enums and RLS rules). Keep them in sync when adding a feature.

## Commands

```bash
npm run dev              # start Vite dev server (http://localhost:5173)
npm run build            # tsc typecheck + vite build
npm run lint             # eslint . --ext ts,tsx (zero warnings allowed)
npm run typecheck        # tsc -b

npm run test             # vitest (watch mode)
npm run test:coverage    # vitest run --coverage (80% lines/functions/statements, 70% branches)

npm run test:e2e         # playwright (auto-starts dev server on :5173)
npm run test:e2e:ui      # playwright UI mode
```

Run a single unit test: `npx vitest run src/lib/masks.test.ts`. Single spec: `npx playwright test tests/auth.spec.tsx`.

Required env vars (`.env`, not committed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Neither CI workflow needs real secrets: `vite.config.ts` sets fake values via `test.env` for Vitest, and `.github/workflows/playwright.yml` sets them as step `env:` for the dev server Playwright spins up — `src/lib/supabase.ts` calls `createClient()` at module load and throws when they are missing, which would otherwise break every page.

## Architecture

**Stack:** React 19 + TypeScript, Vite 7 (SWC plugin), Tailwind CSS v4, shadcn/ui ("new-york" style, Radix via the unified `radix-ui` package), React Router v7 (data router / loaders), TanStack Query v5, Supabase JS v2, Zustand, React Hook Form + Zod.

**Path alias:** `@/*` → `src/*` (in `vite.config.ts` and both `tsconfig.*.json`).

### Routing and app shell

All routes are declared in one place, `src/main.tsx`, via `createBrowserRouter`, nested under two pathless layout routes from `src/components/layout/LayoutWrapper.tsx`: `AuthLayout` (visitor shell, no MenuBar) and `AppLayout` (logged-in shell with MenuBar) — adding a route means picking the right layout parent. `App.tsx` is the root element (scroll reset + `<Outlet />` + `Toaster`). Pages are code-split via the data router's `lazy` property; Home and Login are eager. Route paths are Portuguese (`/necessidades`, `/ongs/:id`, `/painel`, `/minhas-doacoes`, `/notificacoes`).

Route guards live in `src/routes/guards.ts` and are the only guarding mechanism (no wrapper component):

- `protectedLoader` — needs a session, else redirects to `/login`.
- `publicOnlyLoader` — logged-in visitors go to the home of their role.
- `ongLoader` / `adminLoader` — role-gated areas (`/painel`, `/admin`).

Roles come from `profiles.user_type` (`donor` | `ong` | `admin`); the mapping role → landing route is `HOME_BY_USER_TYPE` in `src/features/auth/model/profile.ts` — change it there, not inline.

`QueryClientProvider` wraps the router in `main.tsx` with global defaults from `src/lib/queryClient.ts`: `staleTime: 5min`, `gcTime: 10min`, `retry: 2`, `refetchOnWindowFocus: false`, plus query/mutation error reporting.

### Feature-based structure

Code lives under `src/features/<feature>/`, each composing a subset of: `pages/`, `components/`, `hooks/`, `services/`, `model/` (zod schemas + domain types), `store/` (Zustand), `steps/` (wizard steps). Prefer `model/` for schemas and types — do not introduce a `types/` or `dtos.ts` variant.

**Feature boundaries (enforced by ESLint):** from inside `src/features/`, another feature may only be imported through its public API — `@/features/<name>`, backed by that feature's `index.ts`. Deep imports (`@/features/auth/hooks/...`) fail `npm run lint` (`no-restricted-imports` in `eslint.config.js`). Pages are deliberately NOT in any index — only `src/main.tsx` imports them, directly, for per-route code splitting. Unit tests that cross the boundary must mock the barrel: `vi.mock("@/features/<name>")`, or the `importOriginal` spread pattern when only part of it should be mocked (see `src/routes/guards.test.ts`).

A helper used by 2+ features belongs in `src/lib/`, not in a feature folder.

Shared, non-feature code: `src/components/layout/` (`MenuBar`, `LayoutWrapper`, `RouteError`, `Placeholder`), `src/components/shared/` (page-agnostic widgets: `BackButton`, `LocationFields`), `src/components/ui/` (shadcn primitives — add via `npx shadcn add <component>`, config in `components.json`, re-export from `ui/index.tsx`), `src/hooks/` (`useLocations`), and `src/lib/` (`supabase.ts`, `masks.ts`, `queryClient.ts`, `reportError.ts`, `utils.ts` with the shadcn `cn()` helper).

### State management — three patterns, by concern

- **Server/remote state:** TanStack Query. Query hooks live in each feature's `hooks/`, calling a `services/` function inside `queryFn`/`mutationFn`.
- **Multi-step wizard state:** Zustand. Signup uses `useSignUpWizardStore` (persisted to `localStorage`; `partialize` strips `account.password` and `passwordConfirmation` so the plaintext password never hits storage — keep it that way).
- **Local/UI state:** plain `useState`.

### Data layer

Supabase is the backend: Postgres tables + Auth. Unlike an RPC-first codebase, authorization here is **pure RLS** — the client talks to tables via `supabase.from(...)` and the policies in `supabase/migrations/20260909194500_rls_policies.sql` decide what goes through. Three consequences that bite if ignored:

1. **There is no trigger creating `profiles`.** The row is inserted by the client right after `signUp`, while authenticated (`profiles_insert_own` requires `id = auth.uid()`). Email confirmation must stay OFF in Auth, or there is no session and the insert is rejected.
2. **ONG signup has a mandatory order:** `auth.signUp` → insert `profiles` (`user_type = 'ong'`) → insert `ongs` (with an explicit `verification_status: 'pending'`) → insert `ong_contacts`. `ongs_insert_own` calls `current_user_type()`, which reads `profiles`. `src/features/auth/services/signUp.ts` encodes this, is idempotent per step, and throws `SignUpError` carrying the `stage` that failed.
3. **Only an admin approves an ONG** (`verification_status`) — enforced by a trigger, not by the client.

Service modules group table access by aggregate (`services/profiles.ts`, `services/signUp.ts`, `services/passwordReset.ts`) — add a new call to the aggregate it belongs to, not a new one-function file. Each has a matching `*.test.ts` mocking `@/lib/supabase` (never the service itself) with the chainable builder helper in `src/test/supabaseQueryBuilder.ts`.

SQL that still needs to be applied by hand lives in `supabase/sql/` (run it in the SQL Editor, then delete the file); `supabase/migrations/` holds the schema and RLS already applied to the project.

The DB schema is **English snake_case**; content (category names, etc.) stays in Portuguese because it is shown to the user. All ids are `uuid` (strings), including `states.id` and `cities.id`.

### Styling

Tailwind v4 with no `tailwind.config.js` — theme tokens are defined via `@theme` in `src/index.css`. Brand: `primary` `#F2723E` (laranja Elo), `secondary` `#16535A` (azul-petróleo), background `#FAFAF7`. The `urgency` enum maps straight onto tokens: `success` (low), `warning` (medium), `destructive` (high). Mobile-first: the type scale only grows at ≥48rem.

### Testing

- Unit/component: Vitest + Testing Library, jsdom, globals enabled (no need to import `describe`/`it`). Setup file `src/test/setup.ts` runs `cleanup()` after each test. Tests are colocated as `*.test.ts(x)`; services, hooks and schemas are expected to ship with tests.
- E2E: Playwright, specs in `tests/*.spec.tsx` (own `tests/tsconfig.json`), run against `npm run dev` on port 5173, with all Supabase traffic mocked in `tests/supabaseMocks.ts` via `page.route`. **Route order matters:** in Playwright the last registered route wins, so the `**/rest/v1/**` catch-all is registered *before* the table-specific handlers. Two projects: Desktop Chrome and Mobile Safari (iPhone 13). Video capture is always on.
- Vitest's `exclude` skips `tests/**` and `*.spec.ts`, so unit and e2e suites never collide.
