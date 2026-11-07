# El gráfico de la tesis — Tasks

> Rama: `feature/thesis-chart-detail`. Cada tarea lleva sus tests (`testing.md`).

- [x] **T-01 (S)** P-046 en `proposals.md`; esquema en `contract/assets.ts`. → CH-15
- [x] **T-02 (M)** Mock `GET /assets/:symbol/prices` (recorrido determinístico que termina en `todayPriceOf`), en `handlers.ts`, `handlers.test.ts` y `README.md`. → CH-15
- [x] **T-03 (S)** `getAssetPrices` con tests (validación antes de la red, ítems descartados, errores). → CH-06
- [x] **T-04 (M)** `chartGeometry` con tests: escalas, a favor y en contra, cerrada sin punteada, `equals`, menos de 2 puntos, un rango de horas. → CH-02 a CH-07
- [x] **T-05 (M)** `ThesisChart` con su test (nombre accesible, rótulos, sin punteada cerrada, colores por `data-*`), y los tokens `chart-draw`, `chart-dot`, `chart-fade` y `chart-pulse` en `globals.css` + `design-system.md § Movimiento`. → CH-02 a CH-12
- [x] **T-06 (M)** `ChartScrub` con su test (teclado ← → Inicio Fin, `aria-valuetext`, puntero, salir vuelve a hoy). → CH-16 a CH-19
- [x] **T-07 (S)** `ThesisChartSection` + esqueleto, montado en `ThesisDetail` dentro de `Suspense`. → CH-01, CH-06
- [x] **T-08 (S)** Textos en en, es y pt. → CH-14
- [x] **T-09 (M)** e2e en `thesis-detail.spec.ts`: el gráfico arriba de la tarjeta, recorrerlo con teclado, 360 px sin scroll horizontal, axe en claro y oscuro; `performance.spec.ts` con el detalle bajo 240 KB. `ui-reviewer` y `review-animations`. → CH-11 a CH-13, CH-17
- [x] **T-10 (M)** Como un broker: eje de precios con grilla y etiquetas (`niceTicks`), cabecera con el precio y su cambio que sigue al recorrido, el punto de hoy en vivo, y un mock más real. Tests de `niceTicks`, del eje, de la cabecera y del pulso. → CH-20 a CH-22
