# CPT Market UK

React + Vite trading interface with Supabase Auth and database-backed account/referral profiles.

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`.
3. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the Supabase project URL and publishable/anon key. Never use a service-role key in the browser.
4. Run the database SQL in `supabase/schema.sql` after reviewing your existing Supabase schema. Follow `SUPABASE_SETUP.md` to bootstrap the Super Admin and set the Auth password.
5. Start: `npm run dev`

## Deploy to Vercel

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Project Settings → Environment Variables, then redeploy. `vercel.json` includes the SPA rewrite for direct paths such as `/admin`.

## Security note

Login and registration use Supabase Auth. Referral codes are checked by a database function and re-validated in the `auth.users` insert trigger. Profile access is protected by RLS. Do not add Supabase `service_role` credentials to Vite environment variables or frontend source code.

See `SUPABASE_SETUP.md` for setup and test steps, and `supabase/schema.sql` for the database policies and trigger.
