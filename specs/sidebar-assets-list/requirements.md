# Activos de la columna izquierda como lista con logo — Requirements

> **Estado:** Pendiente de aprobación. No se empieza a implementar hasta que el PO responda Q1 a Q8 (cada una lleva su opción recomendada).
> **Fuente:** pedido del PO (2026-11-12, en el chat): la sección "Activos" de "Tus intereses" tiene que ser más minimalista y mostrar el **logo** de cada activo. Elegida la **opción A: una lista compacta, una fila por activo**, en lugar de la grilla de mosaicos de hoy:
>
> ```
> ◉ BTC      $83.5k     ↑ 2.1%
> ◉ GOOGL    $356.04    ↑ 0.9%
> ◉ EURUSD   $1.12      ↑ 0.4%
> ```
>
> **Hoy:** mosaicos de 3 por fila (`asset-tiles.tsx`) con el símbolo, el cambio de 24 h, el precio, un reloj si el precio está desactualizado, el rótulo "24h" arriba y un borde inferior verde o rojo. Un activo sin precio (WTI) muestra solo el reloj.
> **Backend:** sin cambios y sin propuesta nueva. `GET /api/v1/assets/:symbol` ya devuelve `logoUrl` (cripto con su logo real; el resto, un monograma con sus iniciales, `…/asset-logos/monogram/EURUSD.png`; respuesta del backend del 2026-10-13). El esquema crudo del front ya lo declara; solo falta que el mapper lo lleve a la UI (ver `design.md § 1`). La P-041 de `proposals.md` es **otra cosa**: el logo dentro de `thesis.asset`.

## Objetivo

Que la persona vea de un vistazo qué activos sigue, con su logo, su precio y cómo se movieron hoy, en menos espacio y con menos ruido visual que los mosaicos.

## User stories

- Como usuario con sesión, quiero reconocer cada activo por su logo para ubicarlo sin leer.
- Como usuario, quiero ver el precio y el cambio del día en una sola línea por activo.
- Como usuario, quiero que un activo sin precio o con precio viejo se vea distinto sin que la lista se rompa.

## Criterios de aceptación

### La lista

- [ ] **SA-01** La sección "Activos" es una **lista de una fila por activo** (`ul > li`), de ancho completo. Desaparecen la grilla de 3 columnas, el borde inferior de color y el rótulo "24h" visible.
- [ ] **SA-02** Cada fila, de izquierda a derecha: **logo**, **símbolo** (`BTC`, sin `$`), **precio** y **cambio de 24 h** con flecha. Precio y cambio van alineados a la derecha, así las columnas quedan parejas entre filas. El símbolo se trunca si no entra; el precio y el cambio nunca.
- [ ] **SA-03** El logo sale de `logoUrl` de la API, pasado por `allowedImageUrl` en el mapper. Sin logo, o con una URL de un host no permitido, la fila muestra las iniciales del símbolo sobre el tono de identidad (`UserAvatar`) y la lista no se rompe. Es decorativo (`alt=""`): el nombre está en el texto (Q7: forma).
- [ ] **SA-04** La fila es un link a **`/asset/{SYMBOL}`** (misma ruta de hoy, `communityPath`). Su nombre accesible sale del contenido: nombre del activo, símbolo, precio, cambio con su dirección y el período. La página abierta se marca (`aria-current="page"`) con fondo gris.

### Precio y cambio

- [ ] **SA-05** El cambio se muestra con la molécula `Delta` de hoy: flecha ↑ / ↓ / − más el porcentaje, y un texto para lectores de pantalla ("up 2.14%"). **El color nunca es la única señal.** Sobre un fondo gris (la fila abierta y el hover, Q6) el verde y el rojo pasan al color del texto, como hoy en el mosaico abierto: el verde solo se usa sobre blanco (`design-system.md § Tokens`).
- [ ] **SA-06** El precio se formatea con `useFormatter` (nunca `toLocaleString`), con la regla de Q1.
- [ ] **SA-07** **Sin precio** (Q3): la fila conserva logo y símbolo, el espacio del precio muestra "—" y no hay cambio. Para un lector de pantalla, "No price yet". La fila sigue siendo un link y no cambia de alto.
- [ ] **SA-08** **Precio desactualizado** (Q4): se mantiene el reloj de hoy, chico y en gris, junto al precio, con su texto para lectores de pantalla ("Outdated price"). No cambia el alto de la fila.
- [ ] **SA-09** **Favoritos** (Q2): la estrella y el orden "favoritos primero, con deslizamiento" (`specs/favorites` FV-01 a FV-06) se mantienen. La estrella va **al lado de la fila**, como en Personas: llena y siempre visible si es favorito, vacía solo con hover o foco. Mínimo 24 × 24 px.

### Cuántos y "more"

- [ ] **SA-10** Según el alto de la columna (`specs/sidebar-fill` SF-03), la lista muestra **3** filas con poco alto, **5** con alto medio y **8** con mucho (Q5). Lo que no entra queda detrás de "more" (`specs/sidebar-more`); abierto, se ven todas. Lo escondido va con `display: none` (fuera de Tab y del lector, SF-06). Nunca una fila a medias.

### Estados

- [ ] **SA-11** Cargando, con error y vacía, la sección conserva sus estados de hoy (`InterestsSkeleton`, "No se pudo cargar esta sección", "Únete a la comunidad de un activo…"). El esqueleto dibuja filas de **la misma altura** que las reales, así que al llegar los datos no hay salto de layout (CLS).

### Calidad

- [ ] **SA-12** Mobile first: a 360 px (el panel lateral) sin scroll horizontal; cada fila mide al menos 32 px de alto (objetivo táctil ≥ 24 px, WCAG 2.5.8) y todo se alcanza con teclado.
- [ ] **SA-13** Todo texto nuevo va en `messages/` en en, es y pt (`i18n.md`); solo tokens semánticos (`design-system.md`); axe sin violaciones en claro y oscuro; `tokens-contrast` sigue en verde.
- [ ] **SA-14** **Presupuesto de JS** (`seo.md`): la columna está en todas las rutas. No se agrega ningún componente cliente ni dependencia; el cambio no suma JavaScript. `e2e/performance.spec.ts` sin cambios y en verde (el perfil tiene ~0,7 KB de margen).
- [ ] **SA-15** Los mocks (`API_MOCKS=true`) devuelven `logoUrl` con la forma del backend, y `pnpm api:smoke` valida la respuesta real con el mismo esquema.

## Specs que esto toca

Se anota una nota en cada uno en el mismo PR (`sdd-philosophy.md`, regla 2):

- `specs/sidebar-fill` **SF-03**: el mínimo de activos pasa de "una fila de 3 mosaicos" a 3 filas de lista (mismo número de activos, otro alto: ver `design.md § 6`).
- `specs/favorites` **FV-02**: la estrella ya no va en la esquina de un mosaico, va al lado de la fila.
- `specs/home-motion` **S-02**: el mosaico que sube al pasar el mouse desaparece; la fila usa `tap` y el logo crece un poco, como Personas.

## Fuera de alcance

- Cambiar qué activos se muestran, su orden (favoritos primero) o cuántos trae la API.
- Una moneda por activo: el contrato no manda la moneda del precio (ver Q1).
- El sparkline o gráficos en la fila.
- Reintentar un logo que falla al cargar, y cambiar los logos o monogramas (los sirve el backend).
- Las otras secciones de la columna (Grupos, Personas, Sugeridos).

## Dependencias

- `sidebar-fill`, `sidebar-more`, `favorites`: se respetan (ver arriba).
- La rama `feature/community-create-header-action` agregó la prop `action` a `SidebarSection`. Este spec **no toca** `SidebarSection`, así que no depende del orden de merge.

## Preguntas abiertas para el PO

Cada una lleva su opción recomendada. No se empieza a implementar hasta tener las respuestas.

- **Q1 — Formato del precio.** Hoy: `$`, desde 10.000 en notación compacta, 4 decimales bajo 1 y 2 en el resto (`$64K`, `$1.12`). Dos problemas: (a) un BTC de 83.584,01 queda `$84K` (pierde el decimal que muestra el ejemplo del PO); (b) un par de monedas (EURUSD 1,1234) queda `$1.12` y un índice (S&P 500) queda en dólares, y ninguno de los dos es un precio en dólares.
  - **Recomendado:** compacto desde 10.000 **con un decimal** (`$83.6K`); `$` para acciones, ETFs, cripto y commodities; **sin símbolo de moneda** para índices (2 decimales) y pares de monedas (4 decimales). Obliga a llevar la clase del activo a la UI.
  - Alternativa: mantener todo como hoy y solo sumar el decimal compacto (el ejemplo del PO, `$1.12`, se cumple tal cual, con los defectos de arriba).
  - Aparte: las acciones de la Bolsa de Santiago se cotizan en pesos y hoy salen con `$` en dólares. Ya pasa hoy; el contrato no trae la moneda. Queda fuera de este spec.
- **Q2 — ¿Se mantiene la estrella de favoritos?** El pedido no la menciona, pero `specs/favorites` la exige en cada activo. **Recomendado:** sí, al lado de la fila como en Personas (en un panel de 224 px de ancho útil entra: logo 24 + símbolo + precio + cambio ≈ 190 px). Alternativa: quitarla de Activos, lo que cambia FV-01/FV-02 y deja a los activos sin forma de marcarse desde la columna.
- **Q3 — Activo sin precio (WTI).** **Recomendado:** la fila queda con logo y símbolo, "—" en el lugar del precio y sin cambio. Alternativas: ocultar la fila (el activo "desaparece" de una lista que la persona armó) o dejar el espacio en blanco (parece un error).
- **Q4 — Precio desactualizado.** **Recomendado:** mantener el reloj de hoy, a la izquierda del precio, en gris. Alternativa: atenuar el precio (solo por opacidad; falla el principio de no depender de una sola señal visual).
- **Q5 — Cuántas filas.** Hoy: 3, 6 o 9 mosaicos (1, 2 o 3 filas) según el alto. **Recomendado:** **3 / 5 / 8** filas de 32 px, que ocupa casi lo mismo que hoy (102 / 170 / 272 px contra 85 / 170 / 255). El mínimo de la columna sube unos 17 px (de ~687 a ~704) antes de que aparezca el scroll. Alternativa **2 / 4 / 6**: la altura no crece, pero con poco alto se ven solo 2 activos.
- **Q6 — Hover y fila abierta.** **Recomendado:** fondo gris (`bg-surface` al pasar el mouse, `bg-muted` la fila abierta, como Personas) y, sobre ese gris, el cambio toma el color del texto (la flecha y el signo siguen diciendo la dirección). Alternativa: sin fondo al pasar el mouse, solo el logo que crece (el verde nunca toca un gris, pero la fila se siente menos interactiva).
- **Q7 — Forma del logo.** **Recomendado:** círculo de 24 px (`UserAvatar`, como el logo del activo en la tarjeta de tesis). El monograma del backend ya viene redondeado a sus iniciales. Alternativa: cuadrado redondeado (`rounded-md`, como los logos de los anuncios).
- **Q8 — ¿Qué reemplaza al rótulo "24h"?** **Recomendado:** nada visible (el PO pidió minimalismo) y el período dicho en el nombre accesible del link ("… up 2.14% 24h"). Alternativa: un "24h" muy chico después del porcentaje o un encabezado de columna; sin ninguno, quien ve la pantalla no sabe que el cambio es del día.
