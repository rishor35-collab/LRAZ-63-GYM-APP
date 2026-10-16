# LRAZ63 — Independent migration build 01

This is the ORIGINAL Base44-exported React interface, with the Base44 Vite plugin removed and the first Supabase auth/CRUD adapter added. It is **not yet feature-complete** and must not replace the live Base44 app.

## Launch in StackBlitz
1. Create a **new private GitHub repository** (do not commit real `.env` files or user exports).
2. Upload the contents of this folder to that repository.
3. Open `https://stackblitz.com/github/YOUR_USERNAME/YOUR_REPO`.
4. In StackBlitz create `.env` using `.env.example`, with your own Supabase project URL and **publishable** key. Never use the service-role/secret key.
5. Run `npm install`, then `npm run dev` if the preview does not start automatically.
6. In your Supabase project, review and run `supabase/schema.sql` in SQL Editor **only after confirming it will not conflict with existing tables**. Prefer a separate new Supabase project for testing.

## What is actually migrated
- Preserved original pages, assets, React layout, routes and styling.
- Removed Base44 SDK and Vite plugin dependencies.
- Replaced Base44 public-settings authentication boot sequence with Supabase Auth session checks.
- Implemented email/password registration, login, signout, profile metadata updates, OAuth entry, password reset request and verification in a compatibility module.
- Generated owner-protected Supabase tables from the exported entity definitions.
- Added an initial CRUD compatibility layer for simple entity calls.

## NOT YET MIGRATED — EXPECT ERRORS
- Base44 `aggregate`, advanced filter expressions, pagination and cursor semantics, file storage, backend functions, AI integrations and social access-control policies.
- The original app uses multiple Base44 API call shapes; some screens may fail until each is adapted and tested.
- No real users or historical data have been migrated. Existing Base44 credentials cannot simply be copied.
- No build or end-to-end tests have been run in this environment.
- Data models include social/public entities; current initial RLS intentionally limits all rows to their owner. Public/community sharing requires a dedicated privacy review.

## Safety
Do not paste Supabase service-role keys into browser code. Do not upload personal data to a public repository. The live Base44 app remains unchanged.
