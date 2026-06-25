# snip

A simple personal URL shortener. Sign in with Google, paste a long URL, get a short
`links.qori.land/abc123` link, and manage your links with click counts. Short links are
public — anyone you share them with is redirected, no account needed.

Styled after the [Financial Dashboard](../Financial-Dashboard) (same dark theme, Geist
fonts, and UI components).

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI on `@base-ui/react`
- Supabase — Google OAuth + Postgres (its own project, separate from the dashboard)
- React Query, sonner, nanoid
- Deploy: Vercel · domain: links.qori.land

## How it works

- **`/`** — gated dashboard (create + list your links). Redirects to `/login` if signed out.
- **`/login`** — Google sign-in.
- **`/[slug]`** — public redirect handler. Calls the `resolve_link` Postgres function,
  which increments the click count and returns the target. Open to everyone.
- **`/api/links`** — create (POST) / list (GET) your links; **`/api/links/[id]`** — delete.
- **`middleware.ts`** — refreshes the Supabase session only; never redirects, so public
  short links stay open.

## Local setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill in your Supabase project values:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
3. Apply the schema in `supabase/migrations/0001_init.sql` (via the Supabase MCP or the
   SQL editor).
4. Enable the Google provider in Supabase Auth and add the redirect URLs
   (`http://localhost:3000/auth/callback`, `https://links.qori.land/auth/callback`).
5. `npm run dev` → http://localhost:3000

## Database

Single `links` table with RLS (owners see only their own rows) plus a `resolve_link`
SECURITY DEFINER function for the public redirect. See `supabase/migrations/0001_init.sql`.
