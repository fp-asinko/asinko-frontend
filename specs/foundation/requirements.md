# Foundation — Requirements

> **Spec:** `foundation` · **Rama:** `feature/foundation-project-setup` · **Estado:** ✅ aprobado (2026-10-01)
> **Fase:** 1 de 3 (requirements → design → tasks)

## Objetivo

Dejar la base técnica sobre la que se construyen las vistas del MVP (Home primero; después Detalle de post y Comunidades): el proyecto Next.js con las guías de `docs/ai-guidelines/` aplicadas y verificadas automáticamente, el design system estilo iOS, el multi-idioma, la seguridad base, el cliente de la API con mocks y el esqueleto de la app.

Este spec **no construye ninguna vista de producto**: cada una tiene su propio spec.

## Stakeholders

| Rol | Quién |
|---|---|
| Product Owner y Tech Lead (aprueba) | Juan |
| Backend (`asinko-app`) | eceraolo — informado; este spec no le pide cambios |

## User stories

1. Como **desarrollador**, quiero que las reglas de las guías se verifiquen solas (tipos, lint, formato, tests, commits), para no depender de revisiones manuales.
2. Como **desarrollador**, quiero un cliente de la API con mocks por endpoint, para construir vistas aunque el backend no tenga el endpoint todavía.
3. Como **usuario**, quiero ver Asinko en mi idioma (inglés, español o portugués), con URLs en ese idioma, para usarlo cómodo.
4. Como **usuario**, quiero una interfaz con la estética de iOS, clara por defecto y con modo oscuro opcional, para que se sienta nativa en mi teléfono.
5. Como **usuario**, quiero que la app me muestre algo útil si una página no existe o algo falla, para no quedarme en una pantalla rota.
6. Como **equipo**, queremos que el contenido malicioso de otros usuarios no pueda ejecutar código en el navegador, para proteger a todos desde el día uno.

## Criterios de aceptación

Cada criterio tiene un ID para mapearlo al test que lo verifica en `tasks.md`.

### Proyecto y tooling (`docs/ai-guidelines/tooling.md`, `conventions.md`)

- [ ] **F-01** El proyecto es Next.js 16 (App Router) con TypeScript, gestionado **solo** con pnpm (`pnpm-lock.yaml` es el único lockfile).
- [ ] **F-02** TypeScript corre en modo estricto con las opciones de `tooling.md`; `pnpm typecheck` pasa sin errores.
- [ ] **F-03** `pnpm lint` corre con `--max-warnings=0` e incluye: reglas de Next, accesibilidad (`jsx-a11y`), límites entre capas (`boundaries`), `react/no-danger` y la restricción de `next/link`/`next/navigation` fuera de `src/i18n/`.
- [ ] **F-04** Un import que viola las reglas de dependencias (por ejemplo, un feature que importa otro feature, o `components/` que importa `features/`) hace fallar `pnpm lint`.
- [ ] **F-05** `pnpm format:check` pasa con la config de Prettier de `tooling.md` (incluye el orden de clases de Tailwind).
- [ ] **F-06** Los git hooks corren automáticamente: lint y formato al commitear, commitlint sobre el mensaje, typecheck y tests al pushear. Un commit que no sigue Conventional Commits se rechaza.
- [ ] **F-07** Existen los scripts `dev`, `build`, `start`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:watch`, `test:coverage`, `test:e2e`.

### Testing (`testing.md`)

- [ ] **F-08** Vitest + Testing Library funcionan, con el helper `renderWithIntl` en `src/test/`.
- [ ] **F-09** `pnpm test:coverage` aplica los umbrales de `testing.md` y falla si no se cumplen.
- [ ] **F-10** Playwright corre cada test en un proyecto mobile y uno desktop, contra el build de producción, con chequeo de accesibilidad (axe) disponible.

### Multi-idioma (`i18n.md`)

- [ ] **F-11** Los idiomas son `en` (por defecto), `es` y `pt`. Todas las URLs llevan prefijo de idioma.
- [ ] **F-12** Entrar a `/` redirige al idioma del navegador si está soportado; si no, a `/en`.
- [ ] **F-13** `<html lang>` coincide con el idioma de la página.
- [ ] **F-14** Un test falla si `messages/en.json`, `es.json` y `pt.json` no tienen exactamente las mismas claves.
- [ ] **F-15** Ningún texto visible del esqueleto de la app está hardcodeado: todo sale de `messages/`.

### Design system y tema (`design-system.md`, `overview.md § Estilo`)

- [ ] **F-16** shadcn/ui está inicializado con **Base UI**; no hay dependencias de Radix.
- [ ] **F-17** Los tokens de `globals.css` usan los colores de sistema de iOS en claro y oscuro; el color principal es el azul de sistema (`#007AFF` / `#0A84FF`).
- [ ] **F-18** La tipografía es la fuente del sistema (en Apple, SF Pro); no se descargan fuentes externas.
- [ ] **F-19** La app arranca en **tema claro** aunque el sistema operativo esté en oscuro.
- [ ] **F-20** Un toggle cambia entre claro y oscuro; la elección se mantiene al recargar y al volver otro día, sin parpadeo del tema equivocado al cargar.
- [ ] **F-21** El toggle es accesible: se opera con teclado, tiene nombre accesible traducido y anuncia su estado.
- [ ] **F-22** Las animaciones del esqueleto respetan `prefers-reduced-motion`.

### Esqueleto de la app (`structure.md`, `engineering-principles.md`)

- [ ] **F-23** El layout sigue la estructura del prototipo (`docs/references/prototype.html`), que es la fuente de verdad visual hasta que se itere:
  - **Barra superior**: logo de Asinko (el wordmark del prototipo) que lleva al Home, y el toggle de tema.
  - **Barra inferior** en mobile.
  - **Barra lateral izquierda** para las comunidades: fija en desktop, como panel que se abre desde un botón de menú en mobile.
  - **3 columnas estilo Reddit** en desktop (izquierda: comunidades · centro: contenido · derecha: widgets de la vista). Mobile first: 1 columna en mobile, 2 en tablet (sin la columna derecha), 3 desde desktop. El contenido de la columna derecha lo define cada vista.
- [ ] **F-23b** La navegación solo muestra destinos que existen. Este spec deja Home; Comunidades (barra lateral) y las demás vistas se suman en sus propios specs. Los ítems del prototipo de fases posteriores (Buscar, Notificaciones, Perfil, saldo de tokens) no se muestran hasta que exista su vista: nunca hay links rotos.
- [ ] **F-24** Una URL inexistente muestra la página de "no encontrado" traducida, con un link para volver al Home.
- [ ] **F-25** Un error inesperado muestra la página de error traducida, con opción de reintentar, y se reporta (ver F-35).
- [ ] **F-26** El layout funciona a 360px sin scroll horizontal y en desktop; se navega completo con teclado.

### Seguridad (`security.md`)

- [ ] **F-27** Cada respuesta HTML lleva una CSP con nonce y los headers de seguridad de `security.md` (HSTS, nosniff, Referrer-Policy, Permissions-Policy, `frame-ancestors 'none'`).
- [ ] **F-28** La CSP no permite `'unsafe-eval'` ni `'unsafe-inline'` en scripts en producción.
- [ ] **F-29** Las variables de entorno están validadas en `src/env.ts`; el build falla si falta una requerida o tiene un formato inválido.
- [ ] **F-30** El build de producción falla si `API_MOCKS=true`.
- [ ] **F-31** Fuera de producción, el sitio no es indexable (`robots.txt` con `Disallow: /` y `noindex`).

### Cliente de la API y mocks (`api-integration.md`)

- [ ] **F-32** Existe un cliente HTTP solo de servidor (`server-only`): importarlo desde un Client Component rompe el build.
- [ ] **F-33** El cliente valida cada respuesta con un esquema zod; una respuesta que no cumple el esquema se trata como error inesperado.
- [ ] **F-34** El cliente traduce los errores del backend según la tabla de `api-integration.md`: `401` y `404` a su manejo, `403`/`409`/`422`/`429` a resultados tipados con clave de traducción, `5xx` y errores de red como errores inesperados. Un `code` desconocido cae en un mensaje genérico.
- [ ] **F-35** Los errores inesperados se reportan a Sentry sin datos personales ni secretos. Sin DSN configurado, la app funciona igual y no reporta.
- [ ] **F-36** Con `API_MOCKS=true`, las rutas registradas en `src/mocks/` responden desde fixtures; las demás van a la API real. Mockear o des-mockear una ruta no requiere tocar ningún feature.
- [ ] **F-37** Las fixtures de los mocks se validan contra los mismos esquemas que las respuestas reales; una fixture inválida rompe los tests.
- [ ] **F-38** Con mocks activos, las escrituras usan un **usuario demo** fijo como sesión. Sin mocks y sin login, no hay sesión: las escrituras devuelven el error de "no autenticado".

### Calidad continua

- [ ] **F-39** Un workflow de CI corre, en orden y como bloqueantes: `format:check` → `lint` → `typecheck` → `test:coverage` → `build` → `test:e2e`, más el escaneo de secretos y `pnpm audit`. Queda listo para cuando exista el repositorio remoto.
- [ ] **F-40** Las dependencias nuevas que no estén en `libraries.md` se agregan a la guía con su justificación en el mismo PR.

## Fuera de alcance

- Las vistas del MVP (Home con feed, Detalle de post, Comunidades): un spec cada una. Crear post está postergado.
- Login, registro y conexión con Supabase Auth (fase posterior).
- Implementar endpoints o mocks de dominio (comunidades, posts, feed): los agrega el spec de cada vista. Este spec deja solo el mecanismo y un ejemplo.
- Lighthouse CI y los gates de Core Web Vitals: spec propio cuando haya vistas que medir.
- Deploy, hosting y dominio.
- Engram (memoria del asistente).

## Dependencias

- **Backend:** ninguna bloqueante; lo que falte se mockea.
- **Herramientas:** Node.js 24 LTS (la misma versión que usa `asinko-app`) y pnpm.

## Decisiones tomadas en la revisión

- **Prototipo como fuente de verdad visual** para el layout y la navegación; se itera después.
- **Reddit como referencia de estructura**: layout de 3 columnas en desktop.
- **Sentry** queda configurado sin DSN hasta que exista el proyecto (ver F-35).
