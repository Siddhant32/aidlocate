# AidLocate

A React and Leaflet public-safety application for locating first aid kits and medical facilities, managing trusted contacts, and activating consent-based emergency SOS sharing.

## Run locally

```bash
npm install
npm run dev
```

## Local configuration

Copy `.env.example` to `.env.local` and fill in the values you use:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_NOTIFICATION_API_URL=
VITE_GOOGLE_MAPS_API_KEY=
VITE_EMERGENCY_NUMBER=112
```

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` enable Supabase Authentication. The older `VITE_SUPABASE_ANON_KEY` name is also supported for existing deployments.
- `VITE_NOTIFICATION_API_URL` must point to a backend notification endpoint. No SMS or email is sent by the frontend without this configured provider.
- `VITE_GOOGLE_MAPS_API_KEY` reserves Google Maps support for a future credentialed integration; the current map uses OpenStreetMap fallback.
- `VITE_EMERGENCY_NUMBER` is currently displayed as 112 in the India demo.

## Deploy with Supabase and Vercel

1. Create a Supabase project and run `supabase/schema.sql` once in its SQL Editor.
2. In Supabase **Authentication → URL Configuration**, set the Site URL to your deployed Vercel URL and add that URL (and `http://localhost:5173` for local development) to the Redirect URLs.
3. Import this GitHub repository into Vercel. Use the Vite framework preset, `npm run build` as the build command, and `dist` as the output directory. The included `vercel.json` sends app routes to `index.html`.
4. In Vercel **Project Settings → Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the environments you deploy (Production, Preview, and/or Development). These are browser-visible client settings; never put a secret key or provider credential in a `VITE_` variable. Redeploy after changing environment variables.

For local development, use `.env.local` with the same two Supabase values. `.env` and `.env.*` files are ignored by Git; `.env.example` is safe to commit.

### Optional SOS notifications

The app's `send-sos` Supabase Edge Function sends notifications only when a delivery provider is configured. Deploy it with the Supabase CLI after linking the project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy send-sos
```

Configure provider credentials as Supabase Edge Function secrets (not Vercel environment variables):

```text
RESEND_API_KEY
NOTIFICATION_FROM
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
```

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. `VITE_NOTIFICATION_API_URL` is only needed if you use a separate notification backend instead of the Supabase function; it is a public frontend URL, not a secret.

Without Supabase, authentication and trusted contacts use browser LocalStorage as a clearly labeled demonstration fallback. This is not a production security backend.
