# Supabase setup for CPT Market UK

This source now uses Supabase Auth and `public.profiles` for account identity, balances at registration, and referral attribution. The referral relationship is written by a Postgres trigger, not trusted from browser state.

## 1. Add the Supabase browser settings to Vercel

In Vercel → Project → Settings → Environment Variables, add these exact names for Production (and Preview/Development if needed):

- `VITE_SUPABASE_URL` — Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY` — Supabase publishable/anon key.

Do not add the Supabase `service_role` key to any `VITE_` variable or browser code. Save the variables and redeploy the project.

## 2. Apply the database schema

Open Supabase → SQL Editor. Review `supabase/schema.sql` first, especially if this project already has a `profiles` table. If it does not conflict with existing tables, run the SQL. It creates:

- `public.profiles` with zero-default balances and immutable referral-attribution columns;
- a one-time backfill of existing Supabase Auth users without inventing historical referral links;
- a database trigger that rejects new registrations without an active, valid referral UID (the reserved Super Admin email is the only no-referral exception);
- `lookup_referral_code()` for checking a code without exposing the user directory;
- Row Level Security: a user can read their own profile and profiles that directly used their code; Super Admin can read all profiles;
- `admin_update_profile()` restricted to an active `superadmin` session.

The script's final bootstrap statement promotes the Auth user `ripuworkshop@gmail.com` to UID `100001` and role `superadmin` if that Auth user already exists. It does not create a Supabase Auth login by itself.

## 3. Create or reset the Super Admin Auth user

In Supabase → Authentication → Users:

- If `ripuworkshop@gmail.com` already exists, use the Auth dashboard's password reset/change action and set the desired password there.
- If it does not exist, create that Auth user there, confirm the email, then rerun the final bootstrap `INSERT ... SELECT ... FROM auth.users` statement from `supabase/schema.sql`.

The Admin password is intentionally not embedded in React, JavaScript, or GitHub source. Admin login uses the regular Sign In form with this email and password. The Admin button appears only after Supabase returns the `superadmin` profile role.

## 4. Email confirmation and redirect URL

In Supabase → Authentication → URL Configuration, add the deployed Vercel domain to the Site URL / Redirect URLs. Keep email confirmation enabled if you want verified email registration. After registration the user is returned to the Sign In screen; if confirmation is enabled, they must confirm the email first.

## 5. Test the referral flow

1. Sign in as the Super Admin (UID `100001`).
2. Copy the referral link from Account → Referral.
3. Open the link in a private/incognito browser window.
4. Register a new email using the prefilled referral UID.
5. The database trigger assigns a unique six-digit UID and stores `referred_by_user_id`, `referred_by_uid`, `used_referral_code`, and `created_at`. Both balances are created as `0.00`.
6. After the new user signs in, the referrer sees that account in their own Referral section. Other normal users cannot query that referral list. Super Admin can query all profiles.

## Notes and current project boundaries

- The app's login, registration, profile loading, referral lookup, referral ownership, new-account zero balance, Admin role gate, and Admin profile balance/status RPC are connected to Supabase.
- Some existing trading/history/support widgets in the original project still use their previous local browser state. This package does not claim those modules are now fully server-persisted or that a real exchange/broker execution backend has been added.
- If the project already has a different `profiles` table or different RLS policies, do not blindly run the SQL; reconcile the existing schema first.
