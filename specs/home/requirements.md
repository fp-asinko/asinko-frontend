# Home — Requirements

> **Spec:** `home` · **Rama:** `feature/home-feed` · **Estado:** ✅ aprobado (2026-10-02)
> **Fase:** 1 de 3 (requirements → design → tasks)
> **Fuente de verdad visual y de estructura:** `docs/references/prototype.html` (medido en el navegador el 2026-10-02).

## Objetivo

Construir el Home de Asinko **tal como el prototipo**: barra superior, columna izquierda "Tus intereses", feed central y columna derecha, en desktop y mobile, consumiendo los datos de la API (hoy los mocks, mañana el backend real sin cambios en la vista).

Incluye **reemplazar el estilo iOS de `foundation` por el sistema visual del prototipo**: la decisión D-01 de `specs/foundation/design.md` (colores de iOS) queda reemplazada por este spec.

## Stakeholders

| Rol                                 | Quién                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| Product Owner y Tech Lead (aprueba) | Juan                                                                                   |
| Backend (`asinko-app`)              | eceraolo: este spec le pide las propuestas P-001, P-003 y las nuevas que salgan de acá |

## User stories

1. Como **usuario**, quiero ver en el Home los posts y encuestas de todas las comunidades, para descubrir de qué se habla.
2. Como **usuario**, quiero ver solo lo de las comunidades que sigo, para no perderme lo que me interesa.
3. Como **usuario**, quiero ver de un vistazo cómo se mueven mis criptos, las personas que sigo y mis grupos, para entrar rápido a lo que me importa.
4. Como **usuario**, quiero votar posts y encuestas, para expresar mi opinión.
5. Como **usuario**, quiero que las menciones `$ # @` se vean como links, para ir a lo que mencionan.
6. Como **usuario**, quiero que la app se vea y se use como el prototipo, en el celular y en la compu.

## Criterios de aceptación

### Sistema visual (reemplaza al estilo iOS)

- [ ] **H-01** Los tokens de `globals.css` son los valores efectivos del prototipo:
  - Color principal monocromático `#17181A` (hover `#000000`, sutil `#F1F0ED`).
  - Fondos `#FFFFFF` / `#F7F6F4` / `#F1F0ED`; bordes `#ECEBE7` / `#D9D8D4`.
  - Texto `#17181A` / `#5C5D60` / `#8A8B8E`.
  - Alcista `#17853B`, bajista `#CE2C31`, interesante `#8B5CF6`. Radios 4 / 8 / 12 / 16 px y totalmente redondeado. **Sin sombras.**
- [ ] **H-02** La tipografía es **Figtree** (300–900), autoalojada con `next/font`: sin requests a Google en el navegador. Texto base de 14 px.
- [ ] **H-03** Modo oscuro con la paleta oscura del prototipo, ajustada a la versión monocromática. El toggle se mantiene, con claro por defecto.
- [ ] **H-04** Todo par texto/fondo cumple WCAG AA. El gris `#8A8B8E` (3,4:1) **solo** se usa en elementos no textuales o texto de 18 px o más; para texto secundario va `#5C5D60` (6,6:1). Lo verifica el test de contraste.

### Estructura (shell)

- [ ] **H-05** **Barra superior** de 60 px, translúcida (`#FCFCFB` al 92%) con borde inferior: logo a la izquierda; buscador centrado (680×40, redondeado) en desktop; ícono de búsqueda en mobile; acciones a la derecha (saldo de tokens, campana y perfil), **deshabilitadas** (Q1).
- [ ] **H-06** **Tres columnas** en desktop: izquierda 260 px, centro 780 px, derecha 300 px, como el prototipo. Mobile first: 1 columna en mobile, columna izquierda en panel lateral y barra inferior de 5 ítems.
- [ ] **H-07** **Columna izquierda "Tus intereses"**, con secciones plegables:
  - **Activos**: grilla de 3 columnas con símbolo y variación del día en verde o rojo; el borde inferior de cada mosaico toma el color de la variación.
  - **Personas**: usuarios que sigo, con avatar o iniciales y su precisión.
  - **Grupos**: comunidades donde soy miembro, con avatar, nombre, su último post como subtítulo y etiqueta `MOD` si modero.
  - **Sugeridas**: comunidades para unirme.
- [ ] **H-08** **Columna derecha**: existe en desktop (300 px) para respetar la estructura, **vacía** en el MVP (Q2). Su contenido se define más adelante.

### Feed

- [ ] **H-09** Arriba del feed, la **caja para publicar** del prototipo (avatar + "¿Qué estás pensando?" + Post / Thesis / Live), **deshabilitada** (Q1): crear post está postergado.
- [ ] **H-10** **Pestañas** _Para ti_ (Explorar: todas las comunidades) y _Siguiendo_ (comunidades donde soy miembro), con el estilo del prototipo (subrayado del activo). La pestaña _Live_ (fase 3) se muestra **deshabilitada** (Q1).
- [ ] **H-11** **Filtros** _New_ (orden por fecha, el del contrato) y _Polls_ (solo encuestas) (Q3). _Hot_ y _Top_ llegan cuando el backend soporte ordenar el feed.
- [ ] **H-12** **Tarjeta de post** como el prototipo:
  - Autor (avatar o iniciales, usuario y precisión), comunidad y tiempo relativo.
  - Título y cuerpo (Markdown seguro, sin HTML crudo; los cuerpos largos se recortan con "ver más").
  - Imagen (con `next/image`) o link con su dominio visible.
  - Etiqueta (`tag`).
  - Píldora de votos (▲ puntaje ▼) y cantidad de comentarios.
  - Post editado ("editado"), borrado ("[contenido eliminado]", sin acciones) y post del sistema (sin autor).
- [ ] **H-13** **Tarjeta de encuesta**: pregunta, opciones con barra de resultados y porcentaje, total de votos y tiempo restante. Resultados ocultos hasta votar cuando así lo indica (`ON_VOTE`); cerrada sin votar; voto propio marcado.
- [ ] **H-14** **Menciones** `$ # @` del cuerpo, renderizadas desde `entities` (P-001) como links, nunca armando HTML (Q4):
  - `$BTC` y `#defi` llevan al **Home filtrado por esa comunidad** (un activo usa su comunidad de activo). Un activo sin comunidad se muestra destacado, sin link.
  - `@usuario` se muestra destacado, **sin link** hasta que exista el perfil (fase 2).
- [ ] **H-15** **Votar** posts (▲/▼, quitar el voto) y encuestas, con actualización optimista. Con mocks, el voto es del usuario demo y no llega a la base real (`overview.md`).
- [ ] **H-26** Elementos **deshabilitados** (Q1): se ven como en el prototipo con aspecto atenuado, **se pueden enfocar** con teclado, se anuncian como no disponibles (`aria-disabled`, no `disabled`) y al activarlos (tap, clic o teclado) muestran "Próximamente".
- [ ] **H-16** **Paginación**: al llegar al final se cargan más ítems con `nextCursor` (scroll infinito con botón "Cargar más" como respaldo accesible).

### Estados y errores

- [ ] **H-17** Carga con skeletons con la forma de las tarjetas (sin CLS).
- [ ] **H-18** _Siguiendo_ sin comunidades muestra un estado vacío que invita a unirse a comunidades.
- [ ] **H-19** Si falla el feed (contenido principal) se muestra la página de error con "Reintentar". Si falla una columna lateral, solo esa sección muestra un error y el resto sigue (`engineering-principles.md`).
- [ ] **H-20** Un ítem del feed mal formado se descarta y se reporta, sin romper el feed (`keepValidItems`).
- [ ] **H-21** Un precio desactualizado (`priceStale`) se marca como tal.

### Transversales

- [ ] **H-22** Textos de la UI en `en`, `es`, `pt`. Fechas relativas y números compactos (12,4 K) con el formatter de next-intl según el idioma.
- [ ] **H-23** Accesibilidad: cada ítem del feed es un `article` con título; los votos son botones con `aria-pressed` y nombre accesible; las pestañas y filtros se operan con teclado; axe sin violaciones.
- [ ] **H-24** JavaScript de primera carga del Home ≤ 230 KB gzip (`seo.md`).
- [ ] **H-25** Datos solo desde el servidor (`api-integration.md`): esquema crudo del contrato + mapper a tipos de dominio del feature.

## Fuera de alcance

- Detalle de post y comentarios (spec `post-detail`).
- Página de comunidad y unirse/salir (spec `communities`).
- Crear post (postergado), tesis, live, alertas, glosario, duelos, tokens y notificaciones (fases 2 a 4).
- Resultados de búsqueda.
- Login (las acciones usan el usuario demo con mocks).

## Dependencias

- Datos mock del contrato (`src/mocks/`, rama actual).
- Del backend, para pasar de mocks a datos reales: E02 a E05 implementados y las propuestas P-001 y P-003, más las que agregue este spec.

## Decisiones tomadas (2026-10-02)

| #   | Tema                                                                                                                                             | Decisión                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Q1  | Elementos de fases futuras en la estructura (buscador, tokens, campana, perfil, caja para publicar, pestaña Live, Buscar / Notif / Perfil abajo) | Se muestran **deshabilitados** con "Próximamente" (H-26)           |
| Q2  | Columna derecha                                                                                                                                  | **Vacía** en el MVP                                                |
| Q3  | Orden del feed                                                                                                                                   | Solo **New** y **Polls**; Hot y Top cuando el backend los soporte  |
| Q4  | Destino de las menciones                                                                                                                         | `$` y `#` → Home filtrado por la comunidad; `@` destacado sin link |
