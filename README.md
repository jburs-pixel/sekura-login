# Sekura

Landing institucional de Sekura — el producto de monitoreo de producción de granos para empresas que prestaron plata o insumos a productores.

Stack: Next.js 15 (App Router) · TypeScript estricto · Tailwind 4 · Supabase · deploy a Vercel.

V1 (en construcción): home bilingüe ES/PT, login que entra a Sekura Monitoreo, formulario para pedir demo.

## Setup local

```bash
npm install
cp .env.example .env.local
# Completar las variables de Supabase (las del proyecto en supabase.com)
npm run dev
```

App en `http://localhost:3000` (redirige a `/es` por default).

## Variables de entorno

Ver [`.env.example`](.env.example). Las claves:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` — del proyecto Supabase (Settings → API Keys).
- `SUPABASE_SERVICE_ROLE_KEY` — solo server, nunca al cliente.
- `NEXT_PUBLIC_PLATFORM_URL` — adónde lleva el botón "Iniciar sesión". Default apunta al prototipo embebido en `public/monitoreo/`. Cambiar al dominio definitivo (ej. `https://app.sekura.com.ar`) cuando exista.

## Estructura

```
sekura-app/
├── app/                       Next App Router
│   ├── [locale]/              Rutas localizadas (es / pt)
│   ├── layout.tsx             Root html shell
│   └── globals.css            Design tokens (paleta + fuentes)
├── components/
│   └── layout/                Header, Footer
├── lib/
│   ├── i18n/                  Config + dict t() helper
│   ├── supabase/              server / client / middleware wrappers
│   ├── platform.ts            URL de la plataforma Monitoreo (env-driven)
│   └── result.ts              Result<T, E> tipado
├── messages/                  es.json, pt.json (strings de UI)
├── middleware.ts              Routing por idioma + redirect /
├── public/
│   ├── logo.png               Logo Sekura horizontal (escudo + wordmark)
│   └── monitoreo/             Prototipo de Sekura Monitoreo (HTML + CSVs)
└── scripts/
    └── sentinel/              Script Python para fetch de NDVI real
```

## Sekura Monitoreo embebido

El prototipo de la plataforma vive en [`public/monitoreo/`](public/monitoreo/). Cuando alguien clickea "Iniciar sesión" desde la landing, se navega a `/monitoreo/index.html#BR/scanner/MT-...` (mismo dominio, no cross-origin).

Cuando la plataforma se mude a su propio host (ej. `app.sekura.com.ar`):
1. Cambiar `NEXT_PUBLIC_PLATFORM_URL` en `.env.local` y en Vercel
2. (opcional) borrar `public/monitoreo/` para no servir el prototipo viejo

## Idiomas

V1 soporta `es` (es-AR, default) y `pt` (pt-BR). Para agregar uno nuevo:
1. Agregar a `LOCALES` en `lib/i18n/config.ts` y al mapping `HTML_LANG`
2. Crear `messages/<locale>.json` con todas las keys de `messages/es.json`
3. Sumar al `generateStaticParams` de `app/[locale]/layout.tsx`

## Estado de implementación

Construcción incremental. Estado actual: **Paso 3 — branding + layout + prototipo embebido**.

Próximos: contenido real de la home (paso 4) → form de pedido de demo con tabla `leads` en Supabase (paso 5) → deploy a Vercel (paso 6).
