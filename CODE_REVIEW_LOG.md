Supabase URL vs REST endpoint — VITE_SUPABASE_URL must be the project root (https://xxx.supabase.co), not /rest/v1/.
Env vars require a Vite restart — .env.local changes are not picked up by HMR.
Distinguish UI 404s from API 404s — React Router * vs a failed Supabase network request in DevTools.