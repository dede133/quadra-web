# Quadra

Quadra organiza partidos de fútbol por disponibilidad: el organizador propone ventanas, cada persona marca cuándo puede, y el panel ordena los horarios de forma explicable.

## Stack

Next.js (App Router), TypeScript estricto, Tailwind CSS y Supabase PostgreSQL. Supabase se usa solo desde código de servidor con una Secret Key.

## Requisitos e instalación

Necesitas Node.js 22.13 o superior y un proyecto de Supabase.

```bash
npm ci
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

## Estado y límites

Es un prototipo personal. No incluye cuentas, reservas de campos ni notificaciones.
El enlace de administración da acceso al organizador: comparte únicamente el enlace público. Si pierdes el enlace de administración o borras el almacenamiento del navegador del participante, no hay recuperación de acceso.

Las pruebas cubren clasificación de horarios, fechas y comprobaciones de permisos del servidor con respuestas simuladas de Supabase. No requieren credenciales y no sustituyen una prueba completa contra una base de datos real.

Los guardados de plan/horarios y participante/disponibilidad todavía usan varias operaciones, sin una transacción conjunta. Un fallo intermedio puede dejar datos parciales; también queda pendiente coordinar una respuesta que coincida con la confirmación del organizador. No está preparado para un servicio público con tráfico abierto: falta limitar el abuso de los formularios.

Se rechazan las fechas imposibles y las horas que no existen o se repiten durante el cambio horario. La zona predeterminada es Europe/Madrid.

Para comprobar el flujo completo, crea un partido, abre su enlace público en otro navegador, responde, edita la respuesta y confirma desde el enlace del organizador. Comprueba que después ya no se admiten respuestas.

Las versiones de PostCSS y sharp usadas por Next están fijadas en `overrides` para resolver los avisos del árbol de dependencias sin cambiar de versión mayor de Next.
