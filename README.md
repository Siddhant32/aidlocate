# AidLocate

A React and Leaflet public-safety application for locating first aid kits and medical facilities, managing trusted contacts, and activating consent-based emergency SOS sharing.

## Run locally

```bash
npm install
npm run dev
```

## Optional backend configuration

Create a `.env` file from these variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_NOTIFICATION_API_URL=
VITE_GOOGLE_MAPS_API_KEY=
VITE_EMERGENCY_NUMBER=112
```

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` enable Supabase Authentication.
- `VITE_NOTIFICATION_API_URL` must point to a backend notification endpoint. No SMS or email is sent by the frontend without this configured provider.
- `VITE_GOOGLE_MAPS_API_KEY` reserves Google Maps support for a future credentialed integration; the current map uses OpenStreetMap fallback.
- `VITE_EMERGENCY_NUMBER` is currently displayed as 112 in the India demo.

## Supabase deployment

Apply `supabase/schema.sql` in the Supabase SQL editor.

Deploy the notification function:

```bash
supabase functions deploy send-sos
```

Set these secrets only in Supabase/Vercel server environments:

```text
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NOTIFICATION_FROM
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
VITE_NOTIFICATION_API_URL
```

Do not expose service-role, Resend, Twilio or notification API secrets in frontend code.

Without Supabase, authentication and trusted contacts use browser LocalStorage as a clearly labeled demonstration fallback. This is not a production security backend.
