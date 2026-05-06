# Sekura

Verificación de autenticidad de productos físicos vía QR. Stack: Next.js 15 (App Router) · TypeScript estricto · Tailwind · Supabase (Auth + Postgres + RLS) · deploy en Vercel.

V1: solo Brasil, flujo `scanner`.

## Setup local

```bash
npm install
cp .env.example .env.local
# Completar las variables (ver más abajo)
npm run dev
```

App en `http://localhost:3000`.

## Variables de entorno

Ver [`.env.example`](.env.example). Las críticas:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` — del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — solo server, nunca al cliente.
- `IP_HASH_SECRET` — generar con `openssl rand -hex 32`.

## Estado de implementación

Este repo está en construcción incremental. Estado actual: **Paso 1 — scaffold**. Próximos pasos: wrappers Supabase, migrations SQL, API de scan, landing pública, auth.
