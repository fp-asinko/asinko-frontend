# La tesis como ticket de apuesta — Design

## 1. Piezas

| Pieza                             | Dónde                                             | Qué hace                                                                                                                                        |
| --------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `ThesisTicket` (Server Component) | `components/organisms/thesis-ticket/`             | El panel: activo, objetivo, convicción y plazo o resultado. No conoce el negocio: recibe un `ThesisTicketData` por props, como `ThesisSummary`. |
| `ThesisCard` del feed             | `features/feed/components/thesis-card.tsx`        | Línea de arriba (TK-01, TK-02), el ticket, el claim (TK-09) y las acciones.                                                                     |
| `ThesisCard` del perfil (Q5)      | `features/communities/components/thesis-card.tsx` | La misma composición, sin votos.                                                                                                                |
| Página de la tesis (Q4)           | `thesis-route-page.tsx`                           | El ticket con la variante `detail`, que suma lo que hoy dice `ThesisBet` (fecha de entrada, plazo con hora). `ThesisBet` se borra.              |

`ThesisSummary` queda para la confirmación de crear tesis, que muestra el claim primero a propósito: es lo que la persona está por firmar.

## 2. El ticket

```
┌─ bg-surface · border · rounded-xl · p-4 ──────────────────┐
│ (logo 44)  $NVDA                         ↑ $240           │  ← objetivo: 24px/800, verde o rojo
│            NVIDIA                        +33 % desde $180 │  ← type-meta, muted
│ ───────────────────────────────────────────────────────── │  ← border-t
│ CONVICCIÓN  ▮▮▮▯ Alta        PLAZO  4 nov 2027 · en 12 m  │  ← type-section + type-small
└───────────────────────────────────────────────────────────┘
```

- **Grilla:** `grid grid-cols-[auto_1fr_auto]`. Por debajo de `sm`, si el objetivo no entra, pasa a la segunda fila alineado a la izquierda (`flex-wrap`).
- **Logo:** `UserAvatar` de 44 px (`size-11`, `size-10` en el teléfono), `rounded-full`, con `colorKey` el símbolo. La imagen sale de `asset.logoUrl` (P-041) o del avatar de la comunidad si es la del activo.
- **Objetivo:** `text-bullish` si sube, `text-bearish` si baja, `text-foreground` si es a un precio (PO, 2026-11-05: sin azul). Es texto grande (24 px, 800): pide 3:1 sobre `--surface`, y el verde da 4,4:1 en claro. Los dos pares van en `tokens-contrast.test.ts`. La flecha es un ícono `aria-hidden`; el texto accesible es "Por encima de $240". El color nunca va solo: flecha y palabra.
- **Convicción:** `LevelBars` en solo lectura (las barras del feed de hoy, ya en azules desde 2026-11-04) más el nombre del nivel.
- **Cerrada (TK-07):** la columna de PLAZO pasa a RESULTADO, con el texto de `ThesisState` y el precio de cierre.
- **Badge THESIS (TK-01):** `text-muted-foreground` (PO, 2026-11-05: no en azul) con el ícono `TargetIcon`, en mayúsculas como hoy.

## 3. El claim

`<h2 className="mt-3 type-post-body text-muted-foreground line-clamp-2">`, con el `Link` adentro como hoy. En la página de la tesis (Q4) es el h1, con `type-post-title` y sin recorte, debajo del ticket.

## 4. Datos

`ThesisTicketData`: `{ asset: { symbol, name, path, logoUrl } | null, target, reference, deadline, conviction, state, resolutionPrice }`. Lo arman el feed y el perfil con un mapper (`ticketOf(thesis)`), como `summaryOf` hoy.

**P-041 (propuesta):** `thesis.asset.logoUrl: string | null`, el mismo logo que el avatar de la comunidad del activo. Se mockea con `all`; con `missing`, el respaldo es el avatar de la comunidad.

## 5. Textos

`thesisTicket.*`: `conviction`, `deadline`, `result`, `fromReference` ("{change} desde {price}"), `target.above` / `target.below` (accesibles). El badge, el estado y los niveles reusan los que ya existen.

## 6. Tests

| Qué                                                  | Dónde                                    |
| ---------------------------------------------------- | ---------------------------------------- |
| Ticket: activo, objetivo, cambio, convicción y plazo | `thesis-ticket.test.tsx`                 |
| Cerrada, cancelada y sin activo (TK-07, TK-08)       | `thesis-ticket.test.tsx`                 |
| Tarjeta del feed: línea de arriba, grupo, claim (h2) | `features/feed/.../thesis-card.test.tsx` |
| Contraste del objetivo (verde y rojo, 3:1)           | `tokens-contrast.test.ts`                |
| 360 px, axe y presupuesto de JS                      | `thesis-detail.spec.ts`, `performance`   |
