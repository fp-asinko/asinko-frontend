# Tarjetas del feed con color y vida — Design

> **Estado:** aprobado el 2026-10-03, con Q1–Q3 y D-C1 a D-C3 como se proponen. D-C2 se corrigió al implementar: en este proyecto `rounded-lg` es 12 px (escala sm 4 / md 8 / lg 12 / xl 16), así que el recuadro va en `rounded-xl` (16 px), concéntrico con las opciones (12 px + 6 px de padding). Requisitos en `requirements.md` (FC-01 a FC-14).
> Paleta y razones de contraste medidas por un agente de color con la fórmula de `src/test/tokens-contrast.test.ts`; movimiento revisado por un agente con las skills `find-animation-opportunities` y `emil-design-eng`. Las decisiones que necesitan aprobación están marcadas **D-C**.

## 1. Principios

- **El color está en piezas chicas que identifican** (avatares, leyendas, chips, el mensaje de consenso). La base sigue monocromática: fondos, texto y bordes no cambian.
- **Cada tema tiene sus propios valores.** En oscuro no se invierten los colores del claro (por ejemplo, el azul claro de encuesta da 2,18:1 sobre la pista clara).
- **El color nunca es la única señal** (§ 7). Tampoco se usan el verde y el rojo de sube/baja (`--bullish`, `--bearish`) en avatares ni en encuestas (FC-13).
- **Sin JavaScript nuevo para el color.** Avatares, chips y paneles se resuelven en el servidor. El único cambio en el cliente es el consenso de la encuesta, que es un cálculo puro (FC-14).
- **Movimiento: lo de `home-motion` y nada más.** No hay keyframes nuevos. Solo se agregan secuencias (barras → ✓ → consenso) y hovers.

## 2. Tokens (`globals.css`)

Van en hex, con el oklch de origen en un comentario: el test de contraste lee solo `#hex` y `rgb()`. Cada token se define en `:root` y `.dark` y se expone en `@theme inline`.

### 2.1 Identidad (avatares): 8 tonos

Es el estilo de avatar del prototipo: un gradiente de 135° (de claro a oscuro) con las iniciales encima. El contraste se mide contra el punto más claro del gradiente.

| #   | Tono        | Claro `--avatar-N` → `--avatar-N-to` · iniciales #FFF | Oscuro `--avatar-N` → `-to` / `--avatar-N-foreground` |
| --- | ----------- | ----------------------------------------------------- | ----------------------------------------------------- |
| 0   | Azul 250    | #2378C2 → #0059A2 · 4,63                              | #004F8B → #003872 / #E0F1FF · 7,30                    |
| 1   | Índigo 275  | #5D69CB → #434BAA · 4,83                              | #3B4391 → #282C78 / #E8EDFF · 7,50                    |
| 2   | Violeta 300 | #835CBE → #663E9E · 4,95                              | #593887 → #43216E / #F1EAFF · 7,67                    |
| 3   | Magenta 340 | #AB4B90 → #8B2D72 · 5,07                              | #782B62 → #5F114C / #FDE7F5 · 7,72                    |
| 4   | Naranja 50  | #AF5A21 → #8E3C00 · 4,88                              | #7B3701 → #622000 / #FFE9DD · 7,51                    |
| 5   | Ámbar 70    | #9D6300 → #7E4600 · 4,98                              | #6F4100 → #582B00 / #FCECD9 · 7,46                    |
| 6   | Teal 190    | #007B76 → #005D59 · 5,13                              | #005B57 → #004542 / #D9F5F3 · 6,95                    |
| 7   | Cian 220    | #007694 → #005976 · 5,23                              | #005870 → #004159 / #D9F4FD · 6,96                    |

- En claro, `--avatar-N-foreground` es `var(--avatar-foreground)` (#FFFFFF). En oscuro cada tono tiene su propio tinte.
- No se usa verde 145 ni rojo 25. Teal, cian y ámbar quedaban apenas fuera de gamut: se recortaron, y las razones están medidas sobre el hex ya recortado.

### 2.2 Encuestas: 6 colores

El orden separa los tonos parecidos. El mínimo es 3:1 contra la pista (`--muted`) y contra la caja (`--surface`).

| Token      | Claro (pista / caja)                      | Oscuro (pista / caja) |
| ---------- | ----------------------------------------- | --------------------- |
| `--poll-1` | #026FD7 · oklch(.55 .18 255) · 4,33/4,57  | #5DA6FF · 5,94/6,86   |
| `--poll-2` | #8747D7 · oklch(.55 .21 300) · 4,71/4,97  | #B786FF · 5,59/6,45   |
| `--poll-3` | #C46016 · oklch(.60 .15 50) · 3,66/3,86   | #FD965A · 6,88/7,94   |
| `--poll-4` | #038586 · oklch(.56 .095 195) · 3,92/4,13 | #56BABA · 6,49/7,49   |
| `--poll-5` | #C62685 · oklch(.56 .21 350) · 4,59/4,84  | #F772B7 · 5,72/6,60   |
| `--poll-6` | #A97416 · oklch(.60 .12 75) · 3,55/3,74   | #E0A957 · 7,09/8,19   |

`--poll-track: var(--muted)`. Una encuesta con más de 6 opciones repite los colores desde el 1 (`index % 6`). La etiqueta y el porcentaje llevan el sentido.

### 2.3 Consenso

| Token (`--consensus-*`)                               | Claro                              | Oscuro                             |
| ----------------------------------------------------- | ---------------------------------- | ---------------------------------- |
| `majority` / `-foreground` / `-border`                | #E6F7F3 / #0F5F55 / #99E6D6 · 6,80 | #10302B / #7EE0CC / #1E5249 · 9,07 |
| `minority` / `-foreground` / `-border`                | #F1EDFE / #5B32C2 / #D9CCFB · 6,82 | #231C3D / #C4B2FF / #3C2F6B · 8,55 |
| Empate: reutiliza `surface` / `foreground` / `border` | 16,45                              | 15,64                              |

El teal de la mayoría es el del prototipo y queda lejos del verde de suba (h 175 contra 145). El violeta de la minoría es el de `--interesting`.

### 2.4 Precisión por tramos

| Token (`--accuracy-*`) | Claro (fondo / texto)    | Oscuro (fondo / texto)   |
| ---------------------- | ------------------------ | ------------------------ |
| `high` / `-foreground` | #E4F4E8 / #146B32 · 5,79 | #173424 / #7FD99B · 7,92 |
| `mid` / `-foreground`  | #FAF0D2 / #7A5800 · 5,73 | #3A2F12 / #F0C960 · 8,29 |
| `low` / `-foreground`  | #FCE6E6 / #A8262C · 5,91 | #3D1A1B / #FF9C9C · 7,70 |

- El dorado del prototipo con texto blanco da 3,16:1. Por eso el chip lleva un fondo tintado y texto oscuro del mismo tono.
- FC-13 no alcanza a este chip. Igual, para que un "72 %" verde no se lea como una suba, el número va sin signo ni flecha y el tramo se nombra para lectores de pantalla (§ 7).

### 2.5 Test de contraste

Se agregan a `tokens-contrast.test.ts`, en los dos temas:

- `TEXT_PAIRS`:
  - `avatar-N-foreground`/`avatar-N` ×8.
  - `consensus-{majority,minority}-foreground`/`consensus-*`.
  - `accuracy-{high,mid,low}-foreground`/`accuracy-*`.
- `NON_TEXT_PAIRS`: `poll-N`/`poll-track` y `poll-N`/`surface` ×6.

Un token que baja del mínimo rompe el build (FC-12).

## 3. Color de identidad (FC-01)

`src/lib/identity-color.ts`:

```ts
/** Stable palette slot (0–7) for a user or community: FNV-1a over the handle, no dependency. */
export function identityIndex(key: string): number {
  let hash = 0x811c9dc5
  for (const char of key.replace(/^[@#$]/, '').toLowerCase()) {
    hash ^= char.codePointAt(0) ?? 0
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0) % IDENTITY_COLORS
}
```

- **Clave:** el username para las personas y el slug para las comunidades. Con los datos actuales: `quantsimula` → 1, `macro` → 3, `defi` → 7.
- **Riesgo:** si alguien cambia su handle, cambia su color. Se acepta porque el contrato no expone un id estable en todas las respuestas. Cuando exista (o en el perfil, fase 2), se cambia la clave en un solo lugar.
- **`UserAvatar`:**
  - Sin imagen, usa `AVATAR_CLASSES[identityIndex(name)]`: un array estático con las clases completas (`bg-linear-135 from-avatar-3 to-avatar-3-to text-avatar-3-foreground`). Tailwind no detecta clases interpoladas.
  - Con imagen, todo sigue igual.
  - Se suma el tamaño `xl` (48 px) para FC-02.
  - Sigue siendo un Server Component: el hash no llega al navegador.
- **Dónde se ve:** en todos los lugares que ya usan `UserAvatar`. Es decir, byline de post y encuesta, comentarios, composer, personas, grupos y sugeridas de la columna.

## 4. Byline y precisión (FC-03, FC-10)

- **Tramo:** se calcula con `accuracyTier(rate)` en `features/feed/lib/accuracy-tier.ts`: `high` ≥ 0,70, `mid` ≥ 0,50 y `low` debajo (Q1). El chip pasa a `bg-accuracy-{tier} text-accuracy-{tier}-foreground`, con las clases en un mapa estático.
- **Texto accesible:** el sr-only actual se reemplaza por `feed.card.accuracy`: `"Accuracy {value}, {tier, select, high {high} mid {medium} other {low}}"`.
- **Hover (FC-10):**
  - La byline es `group/byline`. Al pasar el mouse, el avatar hace `scale-105` y el chip suma `ring-1 ring-current`. Las dos son transiciones de 150 ms con `--ease-out`.
  - No se agregan tokens de "tinte fuerte": el anillo toma el color del texto del chip.
  - Con reducir movimiento se quita la escala y queda el anillo, que es un cambio de color.

## 5. Encuestas (FC-02, FC-04, FC-05, FC-06, FC-09)

### 5.1 Logo (FC-02)

- `PollCard` pone el avatar `xl` de la comunidad a la izquierda de la pregunta. Si la encuesta no tiene comunidad, no hay logo y la pregunta ocupa el ancho.
- Las menciones `$` todavía no llegan a la encuesta (P-001), así que el símbolo de activo queda para cuando el contrato lo traiga. FC-02 se cumple con la comunidad.

### 5.2 Opciones y resultados sin saltos de layout

La geometría es **la misma antes y después de votar**. Los resultados pueden llegar varios segundos después del toque (el backend tarda hoy ~1–13 s), así que nada se mueve cuando llegan: cambian el color y el contenido.

```
┌ ul: rounded-xl border p-1.5 ─────────────────────────────┐   antes: border-transparent
│ ┌ opción (button) ─────────────────────────────────────┐ │   después: border-border,
│ │ [■] Label de la opción                         64 %  │ │   bg-linear-to-b from-surface
│ │ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ (barra 6px, absoluta abajo)  │ │   to-card (el recuadro, FC-04)
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

- **El marcador `[■]` (size-4, `rounded-xs`) está siempre** en el lugar donde hoy aparece el ✓, que corre la etiqueta. **D-C1.**
  - Antes de votar es un cuadrado con borde `border-input`, como un radio.
  - Con resultados se rellena con `bg-poll-N` y hace de leyenda.
  - La opción votada lleva el ✓ dentro del marcador (`text-card`: ≥ 3:1 en los dos temas).
  - Si los resultados están ocultos, la votada se rellena con `bg-foreground` y el ✓ va en `text-background`.
- **La barra fina** va en el padding de abajo de la opción (`absolute inset-x-3.5 bottom-1.5 h-1.5 rounded-full`). Su pista es `bg-poll-track` y el relleno `bg-poll-N`, con `origin-left` y `scaleX(share)`. Reemplaza a la barra de fondo actual. El relleno reutiliza `revealed` + `animate-bar-grow` y la transición de `transform` de M-02. Todas crecen a la vez, sin escalonado.
- **Opciones:**
  - Con resultados, el borde de cada opción pasa a transparente sobre el recuadro.
  - La votada: etiqueta y porcentaje en `font-bold text-foreground`. Las demás quedan en `font-medium`.
  - "(your vote)" sigue en sr-only.
- **Antes de votar (FC-06):** al pasar el mouse o enfocar, el borde de la opción y el del marcador pasan a `poll-N`. La utilidad `tap` ya transiciona el borde. No se agrega desplazamiento. El anillo de foco se mantiene.
- **Radio:** `rounded-xl` (16 px) para el recuadro, en vez de los 10 px del prototipo: se queda en la escala 4/8/12/16 y es concéntrico con las opciones, que siguen en `rounded-lg` (12 px) con 6 px de padding (**D-C2**).

### 5.3 Consenso (FC-05)

Es una función pura en `features/feed/lib/poll-consensus.ts`:

```ts
type Consensus = { tier: 'majority' | 'minority' | 'tie'; share: number } | null
pollConsensus({ options, viewerOptionId, totalVotes }): Consensus
```

- **Cuándo es `null`:** sin voto propio, sin porcentajes (resultados ocultos) o con menos de 10 votos (Q2).
- **Tramos:**
  - `tie`: la opción propia empata en el máximo con otra.
  - `majority`: la opción propia es el máximo único.
  - `minority`: cualquier otro caso.
- **Dónde se muestra:** debajo de las opciones, dentro del recuadro, como `<p>` con `rounded-md border px-3 py-2 type-action`. Los colores salen de § 2.3 y lleva un ícono (`UsersIcon`) como señal extra.
- **Mensajes** (`feed.poll.consensus`, ICU):
  - "You voted with the majority: {percent} chose the same"
  - "You're in the minority: {percent} chose the same"
  - "It's a tie: {percent} chose the same"
- **Cuándo se calcula:** **solo con resultados del servidor** (`results`, no `shown`), nunca con el estado optimista. Así no aparece un consenso falso mientras el voto viaja.
- **Al cargar:** si la persona ya había votado, se ve sin animación.
- **Salto de layout (D-C3):**
  - Insertar el mensaje empuja el pie de la tarjeta. Es una respuesta a la acción de la persona, pero si el servidor tarda más de 500 ms, el navegador lo cuenta como CLS de campo. El CLS de laboratorio, que no vota, no cambia.
  - Se acepta en vez de reservar un hueco vacío en cada encuesta sin votar.

### 5.4 Movimiento (FC-09)

La secuencia arranca cuando llega la respuesta del servidor:

| t      | Qué pasa                                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0      | Las barras crecen (`bar-grow`, 600 ms). Leyenda y porcentaje con `animate-fade-in`                                                                                   |
| 0      | El ✓ hace `animate-vote-pop`. `key` = la opción votada (estado `lastVotedId`, que se fija en `vote()`): solo late al votar, nunca al cargar                          |
| 400 ms | El consenso entra con `animate-fade-up [animation-delay:400ms]` y `fill-mode: both`. `key={tier}`: si un cambio de voto cambia el tramo, vuelve a entrar sin retardo |

- **Lo que se descartó:** contadores de porcentaje animados (JS y un número que cambia mientras se lee), barras escalonadas (demoran la comparación) y animaciones de entrada al cargar.
- **Reducir movimiento:** la red de seguridad global de `home-motion` corta las animaciones. Barras, ✓ y consenso aparecen en su estado final y el color queda.

## 6. Comentarios (FC-07, FC-08, FC-10)

- **Panel:** en `comments-toggle.tsx`, la caja interior pasa de `border-t bg-surface` (de borde a borde) a `mx-3.5 mb-3 rounded-lg border bg-surface px-3.5 py-3`, como el prototipo. Desde `md` la tarjeta no tiene padding (decisión de `home`), así que el margen horizontal es `md:mx-0`.
- **Comentario:**
  - El avatar es de color (por `UserAvatar`).
  - El autor va en `font-bold text-foreground` y la hora en `text-muted-foreground`.
  - El texto pasa a `text-foreground`; hoy hereda muted en parte.
  - La fila es `group` y el avatar hace `group-hover:scale-105`.
- **Lista:** `stagger` en el `<ul>` de `comments-preview.tsx`. Entran los primeros 5, 40 ms entre cada uno.
- **"See all comments" (FC-08):** va en `font-bold text-foreground`. La flecha hace `group-hover:translate-x-0.5` y `group-focus-visible:translate-x-0.5`. Sigue siendo `ComingSoon`.
- **Mientras carga:** en vez del texto "Loading…" se muestra un esqueleto de 2 comentarios (avatar + 2 líneas, `aria-hidden`) con la altura de un preview típico. El `role=status` de siempre lo anuncia. Así el salto al llegar el contenido es chico; antes iba de una línea a varias.

## 7. El color nunca es la única señal

| Elemento                  | Señal además del color                                 |
| ------------------------- | ------------------------------------------------------ |
| Opciones de encuesta      | Etiqueta y porcentaje numérico                         |
| Tu voto                   | ✓, negrita y "(your vote)" en sr-only                  |
| Consenso                  | Frase completa e ícono                                 |
| Precisión                 | Porcentaje visible y tramo nombrado en sr-only         |
| Avatares                  | Decorativos (`aria-hidden`); el nombre siempre al lado |
| Hover/foco antes de votar | Cambio de borde y anillo de foco                       |

## 8. Mensajes nuevos (en, es, pt)

| Clave                            | en                                                                       |
| -------------------------------- | ------------------------------------------------------------------------ |
| `feed.card.accuracy` (reemplaza) | `Accuracy {value}, {tier, select, high {high} mid {medium} other {low}}` |
| `feed.poll.consensus.majority`   | `You voted with the majority: {percent} chose the same`                  |
| `feed.poll.consensus.minority`   | `You're in the minority: {percent} chose the same`                       |
| `feed.poll.consensus.tie`        | `It's a tie: {percent} chose the same`                                   |

Se traducen a es y pt en el mismo cambio, porque es copy de interfaz y no de marketing. `feed.poll` y `feed.card` ya están en `CLIENT_NAMESPACES`.

## 9. Performance (FC-14)

- Los colores son clases CSS. El hash y el tramo de precisión corren en el servidor.
- En el cliente se agregan `pollConsensus`, `lastVotedId` y las clases del marcador: estimado < 1 KB gzip sobre 226,9 de 230. Lo verifica `e2e/performance.spec.ts`.
- Si no entra, el consenso se calcula en el servidor y llega como prop, y se vuelve a calcular solo al votar.

## 10. Decisiones para aprobar

| #    | Decisión                                                                                                       | Propuesta                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| D-C1 | Marcador cuadrado siempre visible (radio antes de votar, leyenda después) en lugar del ✓ que corre la etiqueta | Sí: sin saltos y con un acento de color para FC-06                    |
| D-C2 | Radio del recuadro de resultados                                                                               | `rounded-xl` (16 px, escala del sistema, concéntrico) en vez de 10 px |
| D-C3 | El consenso empuja el pie al aparecer                                                                          | Aceptarlo; no reservar espacio en encuestas sin votar                 |
