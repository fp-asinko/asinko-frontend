# Identidad de la tesis — Design

> Estado: **aprobado** (PO, 2026-11-05). Requirements: `requirements.md` (Q1 a Q3 respondidas el 2026-11-05).

## 1. Componentes

| Pieza                        | Dónde                                                    | Qué hace                                                                                                                         |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `thesisProgress` (función)   | `src/lib/theses/progress.ts`                             | Calcula dónde está el precio entre la entrada y el objetivo. Pura y con tests: es donde están los casos borde (TI-02 a TI-07).   |
| `ThesisProgress` (organismo) | `components/organisms/thesis-ticket/thesis-progress.tsx` | La barra y su texto. Server Component, sin negocio: recibe el ticket.                                                            |
| `ThesisStamp` (organismo)    | `components/organisms/thesis-ticket/thesis-stamp.tsx`    | El sello de una tesis cerrada (TI-14). Server Component, `aria-hidden`.                                                          |
| `ThesisTicket`               | `components/organisms/thesis-ticket/thesis-ticket.tsx`   | Se parte en dos talones con el troquel en el medio (TI-12); monta la barra arriba y el sello abajo.                              |
| `CardByline`                 | `features/feed/components/card-byline.tsx`               | Una prop `accuracyWords` para la tesis: "68 % de aciertos" en lugar de "68%" (TI-08).                                            |
| Utilidades `ticket-stub-*`   | `src/app/globals.css`                                    | La máscara de las muescas (TI-13), con `--notch` (8 px). Un valor nuevo va acá, no suelto en un componente (`design-system.md`). |

Todo es de servidor: no se suma JS (TI-18).

## 2. Datos

### Contrato (propuestas)

```ts
// src/lib/api/contract/content.ts, thesisSchema
asset: z.object({
  // … lo de hoy
  /** P-044 (proposal): today's price, as GET /assets/{symbol}. Optional until the backend sends it. */
  price: z.number().nullable().optional(),
  priceUpdatedAt: z.iso.datetime().nullable().optional(),
  priceStale: z.boolean().optional(),
}).nullable(),
/** P-045 (proposal): how many of their theses resolved (correct + incorrect), for TI-09. */
creator: userSummarySchema.extend({ resolvedCount: z.number().int().nonnegative().optional() }).nullable(),
```

Opcionales: un backend que no los manda deja el ticket y el chip como hoy (TI-06, TI-09, TI-20).

### Tipos de dominio

```ts
// src/lib/theses/ticket.types.ts
ThesisTicketData.current: { price: number; at: string | null; stale: boolean } | null

// src/lib/theses/progress.ts
type ThesisProgress =
  | { kind: 'toward'; share: number; remaining: number } // 0 ≤ share < 1; remaining, relative to today's price
  | { kind: 'reached' } // share ≥ 1 (TI-03)
  | { kind: 'against'; change: number } // crossed the entry the other way (TI-04), change vs. the entry
```

`thesisProgress(ticket)` devuelve `null` sin objetivo, con `equals`, sin precio de entrada o sin el precio contra el que se mide (TI-05 a TI-07). Ese precio es el de hoy abierta y el de la resolución cerrada (acertada o errada). Para cancelada, vencida o disputada devuelve `null`.

Para las dos direcciones vale la misma cuenta: `share = (precio − entrada) / (objetivo − entrada)`. Con `below`, el objetivo es menor que la entrada y el signo se da vuelta solo.

### El acierto

`toThesisItem` deja `author.accuracyRate` en `null` cuando `resolvedCount` llega y es menor que 3 (TI-09, Q2). Sin `resolvedCount`, queda como hoy. Así `CardByline` no conoce la regla.

### Mocks

- `extendWithIdentity` (en `src/mocks/thesis-identity.ts`) suma `asset.price` a cada tesis desde `fixtures/assets.ts` y `creator.resolvedCount` desde `fixtures/users.ts`.
- Va como un `MOCK_EXTENSIONS` encadenado en el feed y en `GET /theses/:id`, igual que `extendWithAgreement` (P-043), y con `API_MOCKS=missing` también.
- Los fixtures cubren los cuatro casos: va hacia el objetivo, ya lo pasó, va en contra y sin precio.

## 3. La barra (TI-01 a TI-07, TI-16, TI-17)

```
  Today $236 · needs to rise 14.4% more
  ●━━━━━━━━━━━━━━━━━━●─────────────────────────────○
  Entry $224.72                                        Target $270
```

- **Pista:** `h-1.5 rounded-full bg-border-strong`. El relleno sale de la izquierda y crece con `scaleX(share)`: en el color de la apuesta (`bg-bullish` alcista, `bg-bearish` bajista), como el objetivo (TI-02). La marca del precio de hoy es un punto de 12 px del mismo color, con `ring-2 ring-surface`.
- **Va en contra:** sin relleno. La marca queda en el borde izquierdo, con un `ChevronLeft` hacia afuera, y la cifra es "−4 % desde la entrada".
- **Ya lo pasó:** la barra entera y "Objetivo alcanzado".
- **Texto** (PO, 2026-11-05: "$236 today · 14% to go" no se entendía): arriba de la barra, dónde está y hacia dónde tiene que ir, "**Hoy $236** · tiene que subir un 14,4 % más" (o "bajar", según la apuesta), y si el precio es viejo, "· precio del 3 nov". Debajo, qué es cada extremo: "Entrada $224,72" y "Objetivo $270". Todo `type-meta text-muted-foreground`, el precio de hoy en negrita. El texto no lleva verde ni rojo (va sobre `bg-surface`, y ahí el verde no llega a 4,5:1); el color va en la pista y en la marca, que con 3:1 alcanzan.
- **`data-tone`** (`above` / `below`) dice el color de la barra, para los tests: la pista es `aria-hidden`.
- **Accesible:** la pista es `aria-hidden` y el texto visible la explica, que es la opción "mejor" de TI-16.
- **Cerrada:** "Cerró en $251" en lugar de "hoy".
- **Posición:** dentro del ticket, después de la fila del activo, la convicción y el objetivo, y antes del troquel (Q1). Sin movimiento: es de servidor y no cambia mientras se mira.

## 4. El troquel (TI-12, TI-13)

- El ticket se parte en dos bloques, el talón de arriba (la apuesta y la barra) y el de abajo (el plazo o el resultado). Cada uno tiene su borde y su redondeo (`rounded-t-xl` / `rounded-b-xl`).
- El troquel es la línea punteada del medio: el `border-t border-dashed` del talón de abajo.
- Las muescas son una **máscara**, no círculos pintados: así detrás se ve el blanco o el gris del hover (TI-13).

  ```css
  @utility ticket-stub-top {
    mask:
      radial-gradient(circle var(--notch) at 0 100%, #0000 98%, #000) left,
      radial-gradient(circle var(--notch) at 100% 100%, #0000 98%, #000) right;
    mask-size: 51% 100%;
    mask-repeat: no-repeat;
  }
  /* ticket-stub-bottom: lo mismo con 0 0 y 100% 0. */
  ```

- La máscara también corta el borde en la muesca, que queda como un mordisco sin trazo. Es el aspecto de un ticket real, y el fondo del talón (`bg-surface`) la recorta contra el blanco.
- En la página de la tesis (`variant="detail"`) va igual.

## 5. El sello (TI-14, TI-15, Q3)

- Va solo cerrada, en el talón de abajo: `absolute right-4 bottom-3 -rotate-6`.
- Estilo: borde de 2 px redondeado, 11 px en `font-extrabold`, mayúsculas y `tracking-widest`, con las clases sueltas (no `type-section`, que ya fija peso y espaciado y `cn` no las combina).
- Colores: acertada, `bg-thesis-correct text-thesis-correct-foreground` con el borde en `currentColor`, y ✓. Errada, `thesis-incorrect` y ✗. Cancelada, vencida o disputada, `bg-background text-muted-foreground`.
- Texto: los mismos nombres de estado que `ThesisState` (`thesisSummary.state.*`), sin claves nuevas.
- El "Resultado" del talón deja lugar a la derecha (`pr-28` desde `sm`) para que el sello no tape números (TI-15). A 360 px, el sello baja a su propia línea debajo del resultado, sin inclinarse tanto (`-rotate-3`).
- Es `aria-hidden`: el estado ya se lee en "Resultado" (`Standing`).
- Abierta no hay sello: el chip "Open" sigue junto al plazo (Q3).

## 6. Textos (TI-19)

`thesisTicket.progress`: `line`, un solo mensaje ICU con el precio en `<strong>` ("**Today $236** · needs to rise 14.4% more · price from Nov 3", o "Closed at", "ended … short of the target", "target reached", "… below / above the entry"), para que cada idioma ordene y separe a su manera; `entry` ("Entry {price}") y `target` ("Target {price}"). En en, es y pt, con `TODO(i18n)` si alguna no está aprobada. `feed.card.accuracyWords` ("{value} accuracy rate").

## 7. Riesgos

- **El precio "de hoy" en el feed** depende de P-044. Si el backend prefiere no sumarlo a la tesis, la alternativa es pedir los activos de la página en un solo request (`GET /assets?symbols=`), que también es una propuesta. No se pide cada activo aparte.
- **Máscaras**: todos los navegadores actuales aceptan `mask` sin prefijo (Safari desde la 15.4). Sin soporte, el ticket queda con los bordes rectos, sin romperse.
