# snip — project guide for Claude

Personal URL shortener for Lucas. Sign in with Google → paste a URL → get a short
`links.qori.land/<slug>` link. Short links are **public** (no account needed to use one);
only creating/managing links requires the owner's account.

## Stack

Next.js 14 (App Router) + TS · Tailwind + shadcn-style UI on `@base-ui/react` · Supabase
(`@supabase/ssr`, Google OAuth, Postgres) · React Query · sonner · nanoid · Vercel.

Visual + auth patterns are ported from `../Financial-Dashboard`. Keep them in sync — if
you touch theme tokens, UI primitives, or the Supabase/auth setup, mirror the dashboard's
conventions rather than inventing new ones.

## Key invariants (don't break these)

- **`middleware.ts` must never redirect.** It only refreshes the session. Gating lives in
  `app/page.tsx` (server `redirect('/login')`) and in API routes via `requireUser()`.
  Adding redirect logic to middleware would break public short links.
- **`/[slug]/route.ts` is public.** It calls the `resolve_link` SECURITY DEFINER RPC; do
  not gate it or switch it to a service-role read.
- **RLS owns access control.** The `links` table policy is `auth.uid() = user_id`. API
  routes use the user's anon-authed client — never the service-role key for user data.
- Slugs are random base62, length 7 (`lib/slug.ts`); collisions retry on unique violation.
- `/api/preview` (link thumbnails/titles) is auth-guarded via `requireUser` and SSRF-guarded
  (blocks private/loopback hosts). It reads og:title/og:image from the target; falls back to a
  free screenshot service then favicon. No DB writes — previews are fetched + cached, not stored.

## Supabase

snip has its **own** Supabase project, separate from the dashboard. The Supabase MCP is
scoped to it via `?project_ref=<snip-ref>` so it can never touch the dashboard's project.
Schema lives in `supabase/migrations/0001_init.sql`.

## Env

`.env.local` (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`. `SUPABASE_SERVICE_ROLE_KEY` is
optional (the redirect uses the RPC, so it isn't needed).

## Commands

`npm run dev` · `npm run build` · `npm run lint`
