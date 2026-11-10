# ¿Se cumple? Sí / No en una tesis — Design

## 1. Piezas

| Pieza                               | Dónde                                                                 | Qué hace                                                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ThesisAgree` (hoja cliente)        | `features/feed/components/thesis-agree.tsx`                           | La pregunta, los dos botones, la barra de resultado y la invitación del No. Estado optimista con `useOptimistic` + `useTransition`.              |
| `AgreeBar` (molécula)               | `components/molecules/agree-bar.tsx`                                  | La barra partida Sí / No con sus % y el total. Sin negocio: recibe `{ yes, no }` y se usa también cerrada, en solo lectura (AG-02).              |
| `answerThesis` (Server Action)      | `features/feed/actions/answer-thesis.action.ts`                       | Valida con zod, saca el `userId` de la sesión, llama a `lib/` y devuelve `ActionResult<ThesisAgreement>`.                                        |
| `answerThesisAs`                    | `features/feed/lib/votes-api.ts`                                      | `PUT` y `DELETE` de P-043 con el cliente de la API, como `votePollAs`.                                                                           |
| `ThesisCard`                        | `features/feed/components/thesis-card.tsx`                            | Pone `ThesisAgree` después del claim (AG-01, PO 2026-11-06), en las dos variantes: en la página, antes del razonamiento.                         |
| Contra-tesis en crear tesis (AG-11) | `features/composer/lib/counter-thesis.ts` + `counter-thesis-note.tsx` | Lee `?counter=<id>`, trae la tesis original (`GET /theses/{id}`) y muestra la referencia arriba del formulario. `composer` no importa de `feed`. |

## 2. La fila

```
Abierta, sin votar:
  ¿Se cumple?                                  ( No )  ( Sí )

Votó No (o es el autor, o no tiene sesión, sin la invitación):
  ¿Se cumple?                                  (✓ No )  ( Sí )
  ███████████████░░░░░░░░░░░░░  62 % Sí · 38 % No · 128 votos
  ┌──────────────────────────────────────────────────────── ✕ ┐
  │ ¿Pensás distinto? Publicá tu tesis          [ Crear tesis ] │
  └─────────────────────────────────────────────────────────────┘
```

- **Botones** (PO, 2026-11-05: grandes, como el Bull / Bear del prototipo; PO, 2026-11-09: **No a la izquierda y Sí a la derecha**): grilla de dos columnas, `h-11 rounded-lg border bg-background`, `type-ui` en negrita y negro, 👍 verde / 👎 rojo. Votado: borde de 2 px de su color (`ring-1 ring-inset`) y el ícono relleno. Con resultado, cada botón se rellena desde la izquierda con su parte (`bg-bullish/15` o `bg-bearish/15`, `scaleX`) y muestra su %; debajo, `AgreeBar` solo con las palabras (`words`). El texto no va en verde: sobre el relleno no llega a 4,5:1. `aria-pressed`.
- **Barra:** 6 px, `rounded-full`: el rojo de No (`bg-bearish`) entero, y el verde de Sí (`bg-bullish`) encima, con `scaleX` desde la izquierda. Sin separación: así cambiar la respuesta solo mueve `transform`. Debajo, `type-meta text-muted-foreground` con los dos % y el total. El verde y el rojo van sobre `bg-background` o `bg-surface` como relleno (3:1, ya medido en `tokens-contrast.test.ts`), nunca como texto chico (AG-06).
- **Animación:** el relleno de los botones es una transición de `transform: scaleX` de 600 ms con `--ease-bars`, como las barras de las encuestas: crece de 0 al votar y se corre al cambiar. Nada con `prefers-reduced-motion`. Sin botones (el autor, cerrada), `AgreeBar` dibuja su barra quieta.
- **Toro y oso (AG-19):** `BullMark` y `BearMark` en `components/ui/stance-marks.tsx`, átomos de marca en la grilla de 24 px de lucide (trazo 2, `currentColor`). En el ticket, sobre el precio: `type-section text-muted-foreground` con el animal en `text-bullish` / `text-bearish` (un gráfico: 3:1 alcanza).
- **Invitación:** caja `bg-background border rounded-lg` (la tarjeta pasa a `bg-surface` con el hover), dentro de la región `aria-live`, `animate-fade-up`. Centrada: `SwordsIcon` de lucide en un círculo `bg-bearish/15 text-bearish` (un ícono: 3:1 alcanza), la apuesta (`invite.bet`: `@autor`, `$SÍMBOLO`, dirección, `thesisPrice` y la fecha `medium`; sin objetivo o sin autor, `invite.title`) y la bajada en dos líneas, y el botón primario de 32 px pegado al texto, no contra el borde; a 360 px el botón baja a su propia fila (`flex-wrap`). La tarjeta le pasa `bet` (handle, dirección, precio y deadline): solo esos campos. Se dibuja con `canVote && viewerVote === 'no'`, sin estado propio: aparece también al volver a una tesis votada No y se va al cambiar a Sí o quitar el voto (PO, 2026-11-09; sin ✕) (AG-10).
- **Dentro de la tarjeta del feed:** la fila va sobre el `CardLink`, como la fila de acciones (`relative z-10`), para que tocar un botón no abra la tesis.

## 3. Datos

Tipo de dominio (en `feed.types.ts`):

```ts
type ThesisAgreement = {
  yes: number
  no: number
  viewerVote: 'yes' | 'no' | null
  canVote: boolean
}
```

`ThesisItem.agreement: ThesisAgreement | null`. `null` cuando el backend no lo manda (con `API_MOCKS=false` hasta que P-043 se implemente): la fila no se muestra (AG-18). El mapper pasa `YES`/`NO` a minúsculas.

Quién ve qué: `canVote` lo decide el backend (como `canCancel`: el autor y una tesis cerrada no responden); la sesión, el cliente (`useAuthGate().signedIn`). Una cerrada sin votos no se muestra (lo decide `ThesisCard`).

| Persona       | Botones                       | Resultado                 |
| ------------- | ----------------------------- | ------------------------- |
| Sin votar     | Sí                            | No                        |
| Votó          | Sí                            | Sí                        |
| Autor (AG-07) | No                            | Sí                        |
| Sin sesión    | Sí (abren el modal de cuenta) | Sí                        |
| Tesis cerrada | No                            | Sí, si hubo votos (AG-02) |

## 4. P-043 (propuesta al backend)

**`PUT /api/v1/theses/{id}/agreement`**, body `{ "userId": "uuid", "value": "YES" | "NO" }` → `200 { "yes", "no", "viewerVote": "YES" | "NO", "canVote" }`. Crea o cambia el voto.

**`DELETE /api/v1/theses/{id}/agreement?userId=uuid`** → `200 { "yes", "no", "viewerVote": null, "canVote" }`. Lo quita (Q4).

Errores: `401`; `403 USER_MISMATCH`; `403 OWN_THESIS` (el autor); `404 NOT_FOUND`; `409 THESIS_CLOSED`.

En todo lo que devuelve tesis (feed, `GET /theses/{id}`, `GET /users/{id}/theses`): `"agreement": { "yes": number, "no": number, "viewerVote": "YES" | "NO" | null, "canVote": boolean }`. Detalle en `docs/references/api/proposals.md` § P-043.

Mock: `src/mocks/thesis-agreement.ts`, con `implemented: false`. Las respuestas viven en memoria sobre una base estable por tesis (una de cada cuatro sin votos). Con `missing`, un `MockExtension` agrega `agreement` a las tesis reales del feed y de `GET /theses/{id}`, encadenado con los anuncios del feed (el cliente aplica una sola extensión por ruta).

## 5. La contra-tesis (AG-11)

- La invitación lleva a `/submit?type=thesis&community=<símbolo>&counter=<id>`. `community` ya elige el activo hoy (TC-02).
- `counter` se valida con zod (uuid) en `parseSubmitQuery`; inválido o una tesis que no existe se ignora en silencio: queda crear tesis con el activo.
- Arriba del formulario, una tarjeta de referencia del servidor (`CounterThesisNote`, sin JS): "Respondés a autor: $NVDA ↑ Por encima de $240 al 4 nov 2027" y la sugerencia de la dirección contraria ("Si creés que no llega a $240, poné tu objetivo por debajo"). Va fuera del editor para no sumarle JS. La dirección la sigue decidiendo el precio escrito (TC-24): no se fuerza.
- Solo una tesis abierta, con activo y objetivo (`getCounterThesis`); cualquier otra cosa, sin tarjeta.
- No se manda nada del original al backend (fuera de alcance: el vínculo).

## 6. Errores

| Caso                | Qué pasa                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Cualquier fallo     | Se revierte el optimista y la fila dice "No pudimos guardar tu respuesta" (`role="alert"`), como los votos ▲▼. Sin invitación.          |
| `409 THESIS_CLOSED` | Igual: `THESIS_CLOSED` no es un código conocido del cliente (llega como `UNKNOWN`); al recargar, la tesis ya muestra solo el resultado. |
| `401`               | Se abre el modal de cuenta (`specs/auth`).                                                                                              |
| `403 OWN_THESIS`    | No debería pasar (el autor no tiene botones); se revierte con el error.                                                                 |

## 7. Performance

`ThesisAgree` es la única hoja cliente nueva y va en las rutas con feed. Estimado: ~1,5 KB gzip. Sin zod en el cliente (el esquema vive en la action). Se mide en `performance.spec.ts`; el perfil, la ruta más pesada, tiene ~6,9 KB de margen.
