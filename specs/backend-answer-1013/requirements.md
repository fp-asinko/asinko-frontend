# Adoptar la respuesta del backend (13/10) — Requirements

> **Estado:** aprobado por el PO el 2026-10-14, con Q1 a Q4 como se recomendaron.
> **Fuente:** respuesta del backend a las propuestas (`docs/references/api/responses/2026-10-13-backend.md`) y pedido del PO el 2026-10-14 ("dale con lo que me recomendás"): los tres puntos donde el front hoy contradice al backend o se rompe con el catálogo nuevo. Los mocks que se apagan (P-014, P-016, P-011) y la pestaña Posts del perfil (P-012) van en otro spec.
> **Verificado contra el deploy** (`https://asinko-app-web.vercel.app/api/v1`, 2026-10-14, solo lecturas): `pnpm api:smoke` sin diferencias; `GET /assets?q=` busca en los 100 activos; `GET /assets/BRK.B`, `/assets/SQM-B` y `/assets/XAU%2FUSD` responden 200; **`GET /communities/{símbolo}` responde 404 para la mayoría de los activos nuevos** (TSLA, SPY, MSFT, EURUSD, SQM-B, BRK.B, XAU/USD), y 200 solo para los del seed anterior (BTC, ETH, AAPL, NVDA, VOO).

## Objetivo

Que el front haga lo que el backend decidió: subir imágenes por URL firmada, dejar de intercalar anuncios por su cuenta y abrir la página de cualquier activo del catálogo.

## User stories

- Como usuario, quiero publicar un post con imagen contra el backend real, y que la imagen no lleve mi ubicación.
- Como usuario de lector de pantalla, quiero que la imagen de un post tenga una descripción.
- Como usuario, quiero abrir la página de `$TSLA` o `$XAU/USD` desde una mención o la búsqueda.

## Criterios de aceptación

### A. Imágenes (P-013)

- [x] **BA-01** Subir la imagen de un post usa el flujo del backend: el servidor pide la URL (`POST /uploads/post-image` con `userId`, `contentType` y `size`) y el archivo se sube con `PUT` a esa URL de un solo uso (Q1: quién hace el `PUT`). Se mantienen los controles de hoy: la sesión, el tamaño (4 MB, debajo de los 5 del backend) y la firma de los bytes.
- [x] **BA-02** Los errores del backend llegan como hoy, con su mensaje: `422` (tipo o tamaño) y `502 STORAGE_ERROR` (no se pudo subir, se puede reintentar).
- [x] **BA-03** El post publicado muestra el `imageUrl` que devuelve el backend (la copia sin EXIF), nunca el que se mandó.
- [x] **BA-04** (Q2) El editor tiene un campo opcional **"Descripción de la imagen"** (hasta 300 caracteres) que viaja como `imageAlt`. La tarjeta y el detalle lo usan como `alt`; sin él, el título del post.
- [x] **BA-05** Ya no se borran imágenes desde el front: el backend no ofrece borrar una subida, y la URL es de un solo uso.

### B. Anuncios (P-015)

- [x] **BA-06** (Q3) El front deja de intercalar anuncios: en el feed (cada 10 tarjetas), dentro del post (antes de los comentarios) y entre los comentarios. Se va el mock de `GET /ads`.
- [x] **BA-07** El feed **ignora en silencio** los ítems de un `kind` que no conoce (los anuncios vendrán así): no rompe, no los cuenta como error de contrato y no se reportan a Sentry. Un ítem de un `kind` conocido pero mal formado se sigue descartando y reportando, como hoy.

### C. Símbolos y páginas de activo

- [x] **BA-08** La página de activo acepta los símbolos del catálogo con `.` y `/` (`BRK.B`, `XAU/USD`): la URL lleva el símbolo codificado (`/asset/XAU%2FUSD`) y la validación previa los deja pasar. Lo demás que no es un símbolo sigue sin ir a la red.
- [x] **BA-09** (Q4) Un activo del catálogo sin comunidad tiene página igual.
- [x] **BA-10** Al escribir `$`, la sugerencia sigue abierta con `.` o `/` dentro del símbolo (`$BRK.B`, `$XAU/USD`).

### Calidad

- [x] **BA-11** Mocks al día: `POST /uploads/post-image` (contrato), sin `GET /ads`, activos con `.` y `/`, y un ítem de `kind` desconocido en el feed de prueba.
- [x] **BA-12** Textos nuevos en en, es y pt; axe sin violaciones en el editor con imagen; el presupuesto de JS no sube (sacar los anuncios debería bajarlo).

## Fuera de alcance

- Apagar los mocks de P-014, P-016 y P-011, y la pestaña Posts del perfil con `GET /users/{userId}/content` (próximo spec).
- El precio en la página de activo (P-003) y la pestaña "Respuestas" (P-012): specs propios.
- Editar `imageAlt` de un post ya publicado (no hay editar posts en la fase 1).

## Para el backend

- **Comunidades de los activos nuevos:** de los 100 activos, solo los del seed anterior tienen su comunidad `SYSTEM_ASSET`. El documento de entregables define la página de activo como esa comunidad (`/asset/AAPL` → `GET /communities/AAPL`). ¿Se crean para los 100? (Q4)
- **`GET /assets` sin `?q=` devuelve 20, sin `nextCursor`:** el catálogo completo no se puede recorrer. Hoy el front solo busca con `?q=`, así que no lo bloquea.
- **Imágenes abandonadas:** si alguien sube una imagen y no publica, la subida queda en Storage. ¿El backend las limpia?

## Preguntas resueltas (2026-10-14)

- **Q1. ¿Quién sube el archivo a la URL firmada?** ¿Nuestro servidor (**recomendado**: el navegador sigue sin hablar con otros dominios, la CSP no cambia y los controles de bytes quedan donde están) o el navegador directo, como sugiere el backend (menos tráfico por nuestro servidor, pero hay que abrir la CSP al dominio de Supabase)?
- **Q2. ¿Sumamos la descripción de la imagen ahora?** ¿Sí, como campo opcional debajo de la imagen (**recomendado**: es accesibilidad y el backend ya la guarda) o más adelante?
- **Q3. ¿Sacamos los anuncios del todo?** ¿Sí, componentes incluidos (**recomendado**: el backend va a definir su forma con el algoritmo del feed, y hoy suman JavaScript) o los dejamos guardados sin usar?
- **Q4. ¿Qué pasa con un activo sin comunidad?** ¿Le pedimos al backend que cree la comunidad de cada activo y, mientras tanto, mostramos la página con los datos de `GET /assets/{símbolo}` (nombre, logo, clase) y un estado vacío en lugar del feed y de Unirse (**recomendado**: ningún link de `$` lleva a un 404)? Alternativa: esperar al backend; hasta entonces esos activos dan 404.
