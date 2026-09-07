# Quadra

Quadra organiza partidos de fútbol por disponibilidad: el organizador propone ventanas, cada persona marca cuándo puede, y el panel ordena los horarios de forma explicable.

## Stack

Next.js (App Router), TypeScript estricto, Tailwind CSS y Supabase PostgreSQL. Supabase se usa solo desde código de servidor con una Secret Key.

## Requisitos e instalación

Necesitas Node.js 20.9 o superior y un proyecto de Supabase.

```bash
npm install
cp .env.example .env.local
```

Completa `.env.local`:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

No expongas `SUPABASE_SECRET_KEY`: no lleva prefijo `NEXT_PUBLIC_` y solo se importa desde módulos `server-only`.

## Configurar Supabase

En el SQL Editor de Supabase ejecuta el contenido de `supabase/migrations/20260814000000_create_quadra.sql`, o aplica la migración con la CLI de Supabase conectada a tu proyecto. La migración crea las cuatro tablas, constraints, índices y activa RLS; la app server-side usa la Secret Key para operar sobre ellas.

## Desarrollo y checks

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

## Flujo

1. En `/new` se crea el partido y sus slots contiguos de 60 o 90 minutos.
2. Se redirige al enlace secreto `/manage/[token]`; desde ahí se comparte `/p/[slug]`.
3. Participantes sin cuenta guardan Perfecto / Podría / No puedo. El token de edición queda solo en el almacenamiento local de ese navegador.
4. El panel administra las opciones ordenadas y puede confirmar cualquier slot. Entonces la página pública muestra el partido confirmado.
