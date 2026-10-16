# LRAZ63 — One-time setup (development version)

This is the original Base44 UI with an **incomplete Supabase adapter**, not a finished replacement. Do not disable the Base44 app.

## Step 1 — GitHub
Create a **private** empty repository, then upload the files **inside this ZIP** to its root. GitHub's browser upload may reject large batches; if so, use GitHub Desktop to commit the extracted folder and publish it privately. Never upload `.env`, secrets, or customer exports.

## Step 2 — Supabase
Use a **new, empty Supabase project** for testing, to avoid collisions with your earlier project. Open SQL Editor and run `supabase/schema.sql`. Read the SQL before running it. Under Project Settings > API (or Connect), copy the project URL and **publishable** key. Never use `service_role` or secret keys in the browser.

## Step 3 — StackBlitz
Open `https://stackblitz.com/github/YOUR_USERNAME/YOUR_REPOSITORY`. Add `.env` at the project root, using `.env.example` as the template, and fill in the two public Supabase values. Start with `npm install` and `npm run dev` if StackBlitz does not start automatically. Use a shell terminal, not the terminal occupied by the Vite server.

## Expected state
- Original screens and assets are present.
- Email/password auth and basic CRUD are wired to Supabase.
- Some pages will still fail: advanced filters, aggregations, uploads, backend functions, AI and social sharing have not been migrated or tested.
- Existing Base44 user data has not been transferred.
- No successful install/build or end-to-end test is claimed.

## Developer notes
- `src/api/base44Client.js` is the compatibility adapter.
- `src/lib/supabase.js` creates the client.
- `supabase/schema.sql` is the initial schema, with per-owner RLS. It is not a production security audit.
- Keep the GitHub repository private until a security review is complete.
