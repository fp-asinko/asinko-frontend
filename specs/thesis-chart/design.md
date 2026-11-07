# El gráfico de la tesis — Design

> Estado: **aprobado** (PO, 2026-11-05). Requirements: `requirements.md` (Q1 a Q4 respondidas el 2026-11-05).

## 1. Piezas

| Pieza                               | Dónde                                                | Qué hace                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getAssetPrices` (lib, server-only) | `features/feed/lib/asset-prices-api.ts`              | Pide P-046, valida y mapea a `PricePoint[]`. Valida el símbolo y las fechas antes de la red. Nunca lanza: devuelve `ApiResult`.                     |
| `chartGeometry` (función pura)      | `src/lib/theses/chart-geometry.ts`                   | De los puntos, la entrada, el objetivo, la publicación y el plazo, arma los caminos del SVG y las posiciones de cada punto (0 a 1). Con tests.      |
| `ThesisChart` (organismo, servidor) | `components/organisms/thesis-chart/thesis-chart.tsx` | El SVG: área, línea, entrada, objetivo, punteada, punto de hoy, rótulos. La animación de entrada es CSS. Sin negocio: recibe los datos ya mapeados. |
| `ChartScrub` (hoja cliente)         | `components/organisms/thesis-chart/chart-scrub.tsx`  | La capa interactiva encima del SVG (CH-16 a CH-19): puntero, dedo y teclado. Recibe los puntos ya formateados.                                      |
| `ThesisChartSection` (feature)      | `features/feed/components/thesis-chart-section.tsx`  | Server Component `async`: pide el historial y monta `ThesisChart`, o nada (CH-06). En la página, dentro de un `Suspense` con su esqueleto.          |

## 2. Datos

### P-046 (propuesta)

`GET /api/v1/assets/{symbol}/prices?from=<iso>&to=<iso>`, público.

```jsonc
{
  "symbol": "BTC",
  "interval": "DAY", // "HOUR" si el rango es de menos de 7 días
  "items": [{ "at": "2026-10-13T00:00:00Z", "price": 83584.01 }],
}
```

- Como mucho unos 200 puntos: el backend elige el intervalo.
- Errores: `404` si el activo no existe; `422` si las fechas son inválidas.
- Esquema en `src/lib/api/contract/assets.ts`, con `keepValidItems`: un punto mal formado se descarta y se reporta (`api-integration.md § Listas`).

### Tipos de dominio

```ts
type PricePoint = { at: string; price: number }

type ChartGeometry = {
  line: string // the SVG path from publication to today (or to the close)
  area: string // the same, closed down to the bottom, for the gradient
  projection: string | null // today → target at the deadline (CH-02); null closed or `equals`
  entryY: number // 0..1, from the top
  targetY: number | null
  today: { x: number; y: number }
  points: { x: number; y: number; at: string; price: number }[] // for ChartScrub
  favorable: boolean // today on the target's side of the entry (CH-04)
}
```

- **Escala X:** de la publicación al plazo (Q2). Si hoy queda antes del 60 % del ancho (una tesis a un año, con tres semanas), el eje va en dos tramos: lo que pasó ocupa el 60 % y el tiempo hasta el plazo se comprime en el resto. "Hoy", en el eje, marca dónde cambia la escala (ajuste de la implementación, 2026-11-06: con una sola escala, la línea quedaba en una franja a la izquierda).
- **Escala Y:** de `min(precios, entrada, objetivo)` a `max(…)`, con un 8 % de margen arriba y abajo, para que la entrada y el objetivo siempre se vean.
- **ViewBox:** `0 0 1000 300`, con `preserveAspectRatio="none"` y `vector-effect: non-scaling-stroke`, así el trazo no se deforma con el ancho.
- **Rótulos:** HTML posicionado en % sobre el SVG, para que el texto no se estire.

## 3. El dibujo (CH-02 a CH-07, CH-11, CH-12)

```
 $150,000  🐂 TARGET ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ○
                                                                               ╱ ╱
                                                    ╱╲    ╱●  $91,000 today  ╱
 $83,584   ENTRY ──────────────╱╲──╱╲──╱╲────╱╲───╱──╲╱──────────────────────────────────
                     ╱╲  ╱╲ ╱    ╲╱    ╲╱  ╲╱
              ───╱──╲╱──╲╱                       ▒▒▒▒ area bajo la línea
 Oct 13                                       Today                               Dec 1
```

- **Línea:** 2 px, `stroke-bullish` o `stroke-bearish` si va a favor; si va en contra, `stroke-muted-foreground` (CH-04).
- **Área:** degradé de ese color al 15 % hasta 0, con un `<linearGradient>` de id determinístico (`chart-${thesis.id}`), no con `useId` (gotcha de servidor).
- **Entrada:** línea horizontal de 1 px, `stroke-input` (3:1, CH-11) y continua. **Objetivo:** 1 px punteada, en el color de la apuesta. Las dos con su rótulo a la izquierda (`type-caption text-muted-foreground`), **sin fondo** para no tapar la línea (PO, 2026-11-06): la entrada debajo de su línea y el objetivo del lado de afuera; si el precio pasa por ahí, prueba el otro lado y después el extremo derecho, donde solo corre la punteada, esquivando también el precio de hoy (`levelPlace`). Sin ningún lugar libre, el rótulo va a una **leyenda** arriba a la derecha de la caja, con un trazo corto del estilo de su línea: "Entry $83,584" y "🐂 Target $150,000".
- **Punteada al objetivo:** de hoy al objetivo en el plazo, 1,5 px, dash 4 4, en el color de la apuesta y pleno (al 60 % no llegaba a 3:1, CH-11): el dash ya la distingue de la línea.
- **Hoy:** un punto de 8 px con `ring-2 ring-background`. Al lado, su precio en `type-meta` y en negrita.
- **Eje X:** solo tres fechas, la publicación, "Hoy" y el plazo, en `type-caption`.
- **Caja:** `rounded-xl border bg-background p-3 pt-9` (arriba, lugar para el globo de `ChartScrub`), de 160 px de alto (`h-40`) y 220 px desde `sm` (`sm:h-56`).
- **Nombre accesible:** `role="img"` con `aria-label` (`thesisChart.label`, CH-11). El SVG va `aria-hidden` y los rótulos de adentro también: el nombre ya dice todo.

### Como un broker (CH-20 a CH-22, 2026-11-06)

- **Eje:** una columna de 64 px (`w-16`) a la derecha del dibujo, que se achica en esa medida (`mr-16`). `niceTicks` (`chart-geometry.ts`) da los precios redondos (pasos de 1, 2 o 5 por una potencia de 10). La grilla es `stroke-border`, decorativa. Etiquetas: hoy `bg-{tono} text-background` (se lee en los dos temas), el objetivo `border-{apuesta} text-{apuesta} bg-background` y la entrada `border-input text-muted-foreground`. Se ubican en orden (hoy, objetivo, entrada, redondos) y se descarta lo que queda a menos del 10 % del alto de otra.
- **Cabecera:** vive en `ChartScrub` (es lo que cambia al recorrer), arriba del dibujo (`pt-18` en la caja). El precio, el cambio y la fecha llegan formateados del servidor por punto (`thesisChart.sinceEntry`). Es `aria-hidden`, porque el slider ya la lee en su `aria-valuetext`.
- **En vivo:** `--animate-chart-pulse` pasa a `infinite` (2 s), y solo se dibuja con `live` (abierta).
- **Rótulos de las líneas:** solo la palabra (`thesisChart.entryLevel` y `targetLevel`); `levelPlace` mide con un ancho del 18 %.
- **Mock:** hasta 200 puntos (cada hora como mínimo) y un recorrido en escala logarítmica con la volatilidad del activo, puenteado entre la entrada y el precio de hoy.

## 4. La animación (CH-08 a CH-10, Q1)

Tokens nuevos en `globals.css` (`animate-chart-draw`, `-area`, `-dot`, `-fade` y `-pulse`), la segunda excepción a los 300 ms (`design-system.md § Movimiento`, que se actualiza en el mismo PR):

- **La línea** va en una capa HTML propia (`data-draw`) que destapa un `clip-path`, de `inset(0 100% 0 0)` a `inset(0 var(--chart-rest) 0 0)`, en **1,6 s lineales**. `--chart-rest` es lo que queda a la derecha de hoy: así todo el tiempo dibuja línea. Los dos extremos van escritos, porque de `inset()` a `none` no se interpola y salta a la mitad. Lineal porque es tiempo que pasa (la skill `animate`, progreso). El `clip-path` es la cuarta propiedad que admite esa skill, junto con `transform` y `opacity`.
- **Historial (2026-11-06, "se traba"):** primero animaba un `<rect>` dentro de un `<mask>` de SVG, que se re-rasteriza en cada cuadro. Después, un `clip-path` sin el `to` (saltaba a la mitad), con `--ease-out` (dibujaba casi todo al principio y después se arrastraba) y hasta el borde (quedaba quieto el 40 % del tiempo). El PO pidió más tiempo: de 1,2 s a 1,6 s.
- **El área** se funde (`opacity`, 1,6 s lineales) mientras la línea avanza, así ningún borde duro barre la caja.
- La entrada y el objetivo quedan fuera de esas capas: se ven desde el principio.
- **El punto de hoy** entra con `scale(0.5)` → 1 y opacidad, en 250 ms desde los 1500 ms, y llega con la línea. La punteada aparece a los 1600 ms y el pulso, a los 1700 ms.
- **Reducir movimiento:** la regla global de `globals.css` las termina al instante (CH-10).

## 5. Recorrerlo (CH-16 a CH-19, Q4)

`ChartScrub` es una capa `absolute inset-0` sobre el área del dibujo:

- **Props:** `points: { x: number; y: number; label: string }[]`, con el texto ya formateado en el servidor ("Oct 13 · $86,200 · +3.1% from entry"), y `todayIndex`. El cliente no formatea: no suma el formateador al bundle ni un namespace a `CLIENT_NAMESPACES`.
- **`role="slider"`**, con:
  - `tabIndex={0}`;
  - `aria-label` (`thesisChart.scrub`, "Price by day", que llega por prop);
  - `aria-valuemin={0}`, `aria-valuemax={n-1}`, `aria-valuenow={index}` y `aria-valuetext={label}`.
- **Teclado:** ← → mueven de a un punto, Inicio y Fin van a los extremos. **Puntero:** `onPointerMove` busca el punto más cercano por `x` (búsqueda binaria) y `onPointerLeave` vuelve a hoy.
- **Táctil:** `touch-action: pan-y`, así el arrastre vertical sigue siendo scroll (CH-18).
- **Qué dibuja:** una línea vertical de 1 px `bg-foreground/30` y un punto de 8 px que siguen al día, y su **lectura fija arriba a la izquierda** (`bg-foreground text-background type-caption`, `truncate`), como la de un broker. (2026-11-06: un globo centrado sobre el punto se salía de la caja a 360 px.)
- **Foco:** `focus-visible:ring-3 ring-ring/50` en la caja.
- **Peso:** unos 1,5 KB. Se importa directo, sin `next/dynamic`, porque diferirlo cuesta más que cargarlo (`seo.md`). Antes de hidratar, se ve el SVG de servidor tal cual (CH-19).

## 6. En la página (CH-01, Q3)

`ThesisCard` (`variant="detail"`) recibe el gráfico por la prop `chart` y lo pone **entre su cabecera y el ticket** (PO, 2026-11-06: el botón "Atrás" y el autor van arriba de todo). `ThesisDetail` se lo pasa dentro de un `Suspense`:

```tsx
<ThesisCard chart={<Suspense fallback={<ThesisChartSkeleton />}><ThesisChartSection thesis={thesis} /></Suspense>} … />
```

- Es una sección secundaria (`engineering-principles.md § Manejo de errores`): si el historial falla, no hay gráfico y la tesis se ve igual. Su contenedor lleva `empty:hidden`, así no deja hueco (CH-06).
- El esqueleto tiene el mismo alto, así no hay CLS.

## 7. Mocks

- Ruta `GET /api/v1/assets/:symbol/prices` (`proposal`, `implemented: false`), en `src/mocks/asset-prices.ts`.
- Un recorrido aleatorio determinístico (semilla: el símbolo y `from`) que **termina en el precio de hoy del mock de P-044** (`todayPriceOf`). Así el gráfico y la barra del ticket dicen lo mismo.
- Diario. Por hora si el rango es de menos de 7 días.

## 8. Textos (CH-14)

`thesisChart`:

- `label`: "Price of {symbol} since {start}: from {entry} to {today} today; target {target} by {deadline}". Con un `select` para cerrada y para sin objetivo.
- `entry`, `target`, `today`, `scrub` ("Price by day").
- `point`: "{date} · {price} · {change} from entry".

En en, es y pt. Como el formato se hace en el servidor, no se suma ningún namespace al cliente.
