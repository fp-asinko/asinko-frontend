# Home con movimiento — Design

> **Estado:** aprobado el 2026-10-02 (D-M1 y D-M2 como se proponen; S-01 pasa a `Collapsible` el mismo día). Requisitos aprobados en `requirements.md` (M-01 a M-10, S-01 a S-06, G-01 a G-06).
> Las decisiones que necesitan aprobación están marcadas **D-M**.

## 1. Principios

- **CSS primero.** Transiciones para cambios de estado (son interrumpibles: si la persona vuelve a tocar, se revierten desde donde están, G-05) y `@keyframes` solo para entradas de una vez (el "pop", una tarjeta nueva). Sin librerías (G-03): `motion` queda para animaciones complejas, que este spec no tiene.
- **`transform` y `opacity`** (G-04). La altura se anima solo en los desplegables, que empujan contenido por diseño.
- **Rápido y con salida suave** (G-02): todo ≤ 300 ms con curvas `ease-out`; la única excepción son las barras de encuesta del prototipo (600 ms).
- **El JavaScript no cambia de forma**: las animaciones que dependen de una acción (votar, revelar resultados) se disparan con un atributo o una clase que el componente cliente ya maneja; no se agregan efectos, temporizadores ni medidas del DOM.

## 2. Tokens de movimiento (`globals.css`)

Los valores salen del prototipo; las curvas de salida, de la skill `emil-design-eng`.

| Token           | Valor                            | Uso                                               |
| --------------- | -------------------------------- | ------------------------------------------------- |
| `--ease-out`    | `cubic-bezier(0.23, 1, 0.32, 1)` | Interacciones: press, pop, entradas, desplegables |
| `--ease-bars`   | `cubic-bezier(0.4, 0, 0.2, 1)`   | Barras de encuesta (la del prototipo)             |
| Duración "tap"  | 120 ms                           | Feedback al presionar, hovers de fondo            |
| Duración "base" | 200 ms                           | Desplegables, entradas, subrayado, globo          |
| Duración "bars" | 600 ms                           | Barras de encuesta                                |

Se exponen en `@theme` como `--ease-*` y `--animate-*` para usarlos con las utilidades de Tailwind (`ease-out`, `animate-vote-pop`…). Un valor nuevo se agrega acá, no suelto en un componente (`design-system.md`).

### Utilidades nuevas

- **`tap`**: transición de color, fondo y borde (150 ms, como los hovers del prototipo) y de `transform` (120 ms); al presionar, `scale(0.97)` (M-06, M-07, S-05). Una sola clase para todo lo interactivo del feed y la columna.
- **`stagger`**: en una lista, los primeros 5 hijos entran con `animate-fade-up` escalonados 40 ms (M-05).

### Animaciones (`@keyframes`)

| Nombre                    | Qué hace                                                             | Duración              |
| ------------------------- | -------------------------------------------------------------------- | --------------------- |
| `vote-pop`                | escala 1 → 1,25 → 1                                                  | 200 ms                |
| `count-up` / `count-down` | el número entra desde abajo / arriba (`translateY` 60% → 0) con fade | 180 ms                |
| `bar-grow`                | `scaleX(0)` → 1, desde la izquierda                                  | 600 ms, `--ease-bars` |
| `fade-up`                 | opacidad 0 → 1 y `translateY(8px)` → 0                               | 200 ms                |
| `fade-in`                 | opacidad 0 → 1                                                       | 200 ms                |
| `underline-in`            | `scaleX(0)` → 1, desde el centro                                     | 200 ms                |
| `live-pulse`              | anillo que crece y se desvanece alrededor del punto                  | 2 s, infinito         |

## 3. Reducir movimiento (G-01)

Una red de seguridad global en `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Cubre también lo que no escribimos nosotros (el panel lateral de shadcn/Base UI). Las animaciones terminan al instante en su estado final, así que nada queda a mitad de camino (por ejemplo, una barra en 0). Los `motion-safe:` / `motion-reduce:` existentes se mantienen.

## 4. Feed

| #              | Dónde                                                      | Cómo                                                                                                                                                                                                                                                                                                                                                           |
| -------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M-01**       | `vote-control.tsx`                                         | Un estado `lastVote` (`'up' \| 'down' \| null`, null al cargar) que se fija solo al votar (Q2: no al quitar). La flecha votada lleva `key={popKey}` y `animate-vote-pop`, así cada voto reinicia el pop. El número va en un contenedor con `overflow-hidden` y `key={score}`, con `animate-count-up` o `-down` según la dirección. Al cargar no hay animación. |
| **M-02**       | `poll-voting.tsx`                                          | Un estado `revealed` que pasa a `true` cuando el voto revela los resultados. Con `revealed`, cada barra lleva `animate-bar-grow` (`origin-left`) y los porcentajes `animate-fade-in`. Al cambiar de opción, el ancho transiciona con `transition-[width] duration-[600ms] ease-bars`. Con los resultados ya visibles al cargar, nada se anima.                 |
| **M-03**       | `comments-toggle.tsx`                                      | El panel se monta la primera vez que se abre y **ya no se desmonta**: abrir y cerrar animan `grid-template-rows` de `0fr` a `1fr` (200 ms). Cerrado lleva `inert` y `aria-hidden`, así no recibe foco ni se lee. El chevron ya rota.                                                                                                                           |
| **M-04**       | `feed-tabs.tsx`, `feed-filters.tsx`                        | El subrayado pasa de borde a un `::after` con `animate-underline-in`; al navegar, la pestaña nueva lo recibe y la animación corre. Las píldoras usan `tap`.                                                                                                                                                                                                    |
| **M-05**       | `load-more.tsx`                                            | Cada página nueva va en un `<ul class="stagger">`. La primera página no (Q3).                                                                                                                                                                                                                                                                                  |
| **M-06, M-07** | botones de tarjeta, opciones, píldoras, pestañas, composer | Clase `tap` en lugar de los `hover:` sueltos.                                                                                                                                                                                                                                                                                                                  |
| **M-08**       | `coming-soon.tsx`                                          | El globo transiciona `opacity` y `translate` (de 2 px hacia afuera del botón a 0) en 150 ms.                                                                                                                                                                                                                                                                   |
| **M-09**       | `post-card.tsx`                                            | Ver **D-M1**.                                                                                                                                                                                                                                                                                                                                                  |
| **M-10**       | `feed-tabs.tsx`                                            | El punto de _Live_ lleva un `::after` con `animate-live-pulse`.                                                                                                                                                                                                                                                                                                |

> **D-M1 — ✅ aprobada: fade de las imágenes (M-09).** El fade al terminar de cargar necesita el evento `onLoad`, o sea una pequeña hoja cliente (`FadeImage`, ~0,3 KB). Problema: la imagen del primer post suele ser el elemento más grande de la pantalla (el LCP), y mientras está con opacidad 0 Chrome no la cuenta, así que la métrica de carga empeora. **Propuesta:** el fade solo en las imágenes que llegan con "cargar más"; las de la primera página se muestran de una, como hoy. Alternativa descartada: fade en todas (empeora el LCP, que es un gate bloqueante de `seo.md`).

## 5. Columna "Tus intereses"

| #        | Dónde                                                            | Cómo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S-01** | `sidebar-section.tsx`                                            | **Cambio del 2026-10-02:** el `<details>` nativo solo se anima en Chrome y Edge, y la animación tiene que verse en todos los navegadores. Pasa a `Collapsible` de shadcn (Base UI, `pnpm dlx shadcn@latest add collapsible`): el panel anima su alto con `--collapsible-panel-height` (200 ms, `--ease-out`) y el trigger lleva `aria-expanded`. Abierto por defecto, así que antes de hidratar se ve igual que hoy. Costo: el JS de Base UI ya se carga (panel lateral, switch); lo nuevo se mide contra el presupuesto en T-07. |
| **S-02** | `asset-tiles.tsx`                                                | `tap` + `hover:-translate-y-0.5` y `focus-visible:-translate-y-0.5`; el borde inferior pasa de 3 a 4 px con `scaleY` de un pseudo-elemento (no cambia el alto). Sin sombras (el sistema no las usa).                                                                                                                                                                                                                                                                                                                              |
| **S-03** | `people-list.tsx`, `group-list.tsx`, `suggested-communities.tsx` | Filas con `tap` y fondo `surface` en hover; el avatar con `group-hover:scale-105` (`origin-center`, 200 ms). Las personas no son links (Q4 de `specs/home`): solo hover, sin press.                                                                                                                                                                                                                                                                                                                                               |
| **S-04** | ver **D-M2**                                                     | Comunidad activa: fondo `muted`, borde `foreground` y `aria-current="page"`, con transición de fondo y borde (200 ms).                                                                                                                                                                                                                                                                                                                                                                                                            |
| **S-05** | "more", "Create group", "+ Join"                                 | `tap`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **S-06** | `sheet.tsx` (shadcn)                                             | Duración 200 ms y `--ease-out` en la entrada y la salida del panel; el resto queda como lo escribe el CLI (cambio mínimo con comentario `asinko:`).                                                                                                                                                                                                                                                                                                                                                                               |

> **D-M2 — ✅ aprobada: cómo sabe la columna qué comunidad está activa (S-04).** La columna vive en el layout, que no recibe los parámetros de la URL. **Propuesta:** un link cliente chico, `CommunityLink` (~0,5 KB), que lee `?community=` con `useSearchParams` y el path con `usePathname` de `@/i18n/navigation`, y se marca activo solo en el Home. Lo usan los mosaicos, los grupos y las sugeridas; su contenido sigue renderizado en el servidor (se pasa como `children`). Alternativa descartada: pasar la comunidad desde cada página al layout (no hay forma en el App Router sin volver dinámico de más el layout o duplicar la columna en cada página).

## 6. Pruebas

- **Unitarias** (lo que se puede ver en jsdom: estado, no píxeles):
  - `vote-control`: sin animación al cargar; `data-animate="up"` al votar a favor, `"down"` en contra; nada al quitar el voto.
  - `poll-voting`: sin `revealed` al cargar con resultados visibles; con `revealed` después de un voto que los revela.
  - `comments-toggle`: el panel cerrado queda montado con `inert` y `aria-hidden`; abrir lo vuelve a habilitar.
  - `community-link`: `aria-current="page"` solo con `?community=` igual a su slug y en el Home.
- **E2E** (`e2e/home-motion.spec.ts`, mobile y desktop):
  - Con `reducedMotion: 'reduce'` emulado, ninguna animación ni transición dura más de 1 ms después de votar, abrir comentarios o cargar más.
  - Sin reducir el movimiento, las barras de una encuesta recién votada arrancan en `scaleX` menor a 1 y terminan en 1.
  - El CLS medido con `PerformanceObserver` mientras se abren comentarios, se carga más y se vota queda por debajo de 0,1 (G-04).
  - Comunidad activa: con `?community=btc`, el mosaico `$BTC` tiene `aria-current="page"`.
  - El presupuesto de JS y axe siguen pasando (G-03, G-06).
- **Revisión**: la skill `review-animations` sobre los componentes tocados, y el `ui-reviewer` antes del PR.

## 7. Ajustes de la implementación (2026-10-03)

- **M-02**: la barra no anima `width` sino `transform: scaleX(share)` sobre un ancho completo, para que vaya por la GPU (revisión con `review-animations`). `bar-grow` arranca en `scaleX(0)` y termina en el valor de la barra.
- **M-03 y S-01**: cerrar dura 150 ms y abrir 200 ms (entrada y salida asimétricas).
- **S-02**: el mosaico no cambia de fondo ni en hover ni activo: el verde de la variación sobre `surface` o `muted` no llega a 4,5:1 (lo marcó axe). Se eleva en hover y el activo se marca con el borde. El refuerzo del borde inferior quedó afuera: la elevación ya da la señal y el borde extra movía el contenido.
- **D-M2**: `useSearchParams` se reexporta desde `@/i18n/navigation` para que código y tests usen un solo módulo (y un solo mock).
- **Presupuesto**: 226,9 KB de 230 al cerrar (el `Collapsible` sumó 4,4 KB).

## 8. Cambios en guías

- `design-system.md`: tokens de movimiento, utilidades `tap` y `stagger`, la red de seguridad de reducir movimiento y la regla "transiciones para estados, keyframes para entradas".
