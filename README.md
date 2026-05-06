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

## Migrations (Supabase)

Las migrations viven en [`supabase/migrations/`](supabase/migrations/) numeradas en orden.

### Cómo correrlas (sin instalar Supabase CLI)

1. Abrí el dashboard del proyecto en https://supabase.com/dashboard
2. Sidebar izquierdo → **SQL Editor**
3. Click en **+ New query**
4. Copiá el contenido completo de `supabase/migrations/0001_initial_schema.sql` y pegalo
5. Click en **Run** (o `Cmd+Enter`)
6. Deberías ver `Success. No rows returned`

Las migrations son idempotentes (`if not exists` + `on conflict do nothing`), así que correrlas dos veces no rompe nada.

### Cómo probar los 4 estados

Tokens del seed para cada caso:

| Estado | Token |
|---|---|
| `authentic` | `MT-5108402-A1B2C3D4E5F6789012345678ABCDEF01` |
| `already_claimed` | `MT-5108403-B2C3D4E5F6789012345678ABCDEF0102` |
| `unknown` | cualquier token con formato válido pero no seedeado, ej. `MT-9999999-FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF` |
| `suspicious` | escaneá cualquier token activo más de 10 veces en 24h |

## Estado de implementación

Construcción incremental. Estado actual: **Paso 3 — schema + RLS + RPC + seed**. Próximos: validación de token, rate limit, API route, landing pública, auth.
