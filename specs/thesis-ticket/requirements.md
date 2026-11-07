# La tesis como ticket de apuesta — Requirements

> Estado: **aprobado** por el PO el 2026-11-05 ("dale"), con Q4 y Q5 como se recomendaban. Pedido del 2026-11-04: "tenemos que darle identidad a las thesis, como tiene glossary, no puede parecerse a un post". En el prototipo manda el logo del activo, la convicción, el precio y la fecha; el claim y el razonamiento quedan en segundo plano.

## Decisiones del PO (2026-11-04)

| #   | Pregunta                   | Decisión                                                                                                                                                                                                                                                                                                     |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | Estructura                 | **Ticket de apuesta**: el activo y el objetivo arriba, convicción y plazo debajo, el claim después, chico y gris.                                                                                                                                                                                            |
| Q2  | Identidad frente a un post | **Panel**: la apuesta va en un panel `bg-surface` con borde (reemplaza "monocromático, sin franja"). Se pidió con el azul del logo en el badge y el objetivo; el PO lo cambió el 2026-11-05: el badge en gris y el objetivo en verde o rojo según adónde va. El azul queda solo en las barras de convicción. |
| Q3  | Autor y grupo              | **Arriba, en chico**: una línea con THESIS y el estado a la izquierda, el autor y la hora a la derecha.                                                                                                                                                                                                      |
| Q4  | Página de la tesis         | El mismo ticket arriba, que absorbe la tabla de la apuesta (`ThesisBet`): los números una sola vez (PO 2026-11-03).                                                                                                                                                                                          |
| Q5  | Pestaña Tesis de un perfil | El mismo ticket, sin votos (como hoy).                                                                                                                                                                                                                                                                       |

## User stories

- Como lector del feed, quiero reconocer una tesis de un vistazo y ver **sobre qué activo apuesta, a qué precio, para cuándo y con cuánta convicción**, sin tener que leer el claim.
- Como autor, quiero que mi apuesta se vea como una apuesta, no como un post más.

## Criterios de aceptación

### La línea de arriba (Q3)

- [ ] **TK-01** La cabecera de todos los tipos de post (`CardByline`): primero el grupo o el autor, con su avatar, y `hace 11 h`; a la derecha, donde va POLL, el badge **◎ THESIS** en gris y el estado (Abierta, Acertada, Errada…). El motivo del feed ("Porque seguís #argentina") sigue encima, como hoy. (PO, 2026-11-05: antes THESIS y el estado iban primero; una tesis se encabeza como los demás posts.) En la pestaña "Tesis" de un perfil, sin autor (el perfil es suyo): `hace 11 h` a la izquierda y THESIS a la derecha, antes del "⋯".
- [ ] **TK-02** Si la tesis está en un grupo que no es la comunidad del activo, el grupo encabeza, con el autor debajo y Unirse cuando corresponde (CP-07). En la comunidad del activo no se repite (el activo ya está en el ticket): la cabecera muestra al autor con su foto, como un post del canal personal.

### El ticket (Q1, Q2)

- [ ] **TK-03** Un panel `bg-surface` con borde y `rounded-xl`, sin sombra. Es lo que distingue a la tesis de un post.
- [ ] **TK-04** **Tres celdas con la misma forma** (PO, 2026-11-06: "los 3 conceptos son importantes"): un rótulo chico arriba (ACTIVO, CONVICCIÓN, OBJETIVO), el valor y una línea gris debajo. Desde `sm`, una al lado de la otra con una línea fina entre ellas (sin los "›", que parecían botones); en el teléfono, el activo y el objetivo arriba y la convicción debajo. **Activo:** su logo de 24 px y el símbolo (`$NVDA`), que llevan a su página; debajo, el nombre. Sin logo, las iniciales en su tono de identidad.
- [ ] **TK-05** **Objetivo:** el valor más grande del ticket (24 px; el activo y la convicción, 18 px: a 24 px se veían demasiado grandes, PO 2026-11-06), en verde si apuesta a que sube y en rojo si apuesta a que baja, con su flecha (↑ por encima, ↓ por debajo). Su rótulo lleva el toro o el oso (`specs/thesis-agree` AG-19). Debajo, cuánto se mueve desde el precio de entrada: "+33 % desde $180". La flecha va con su texto: el color nunca es la única señal.
- [ ] **TK-06** **Convicción:** las 4 barras azules y el nombre del nivel ("Alta"); debajo, su lugar en la escala ("3 de 4"). Debajo de las tres celdas, después del troquel, el PLAZO con la fecha ("4 nov 2027") y cuánto falta ("en 12 meses").
- [ ] **TK-07** **Cerrada:** el plazo da lugar al resultado. Acertada o Errada con ✓ / ✗ y el precio de cierre; Vencida, Disputada y Cancelada con su texto, como hoy en `ThesisState`.
- [ ] **TK-08** **Sin activo** (una tesis cualitativa vieja): el ticket muestra solo la convicción y el plazo.

### El claim (Q1)

- [ ] **TK-09** El claim va **después** del ticket, en `type-post-body` (15 px, regular) y gris (`text-muted-foreground`), en 2 líneas como máximo. Sigue siendo el título de la tarjeta (h2) y el link de su página para el teclado y el lector de pantalla.
- [ ] **TK-10** El razonamiento no aparece en el feed (como hoy).

### Igual que hoy

- [ ] **TK-11** Toda la tarjeta abre la página de la tesis, con el gris al pasar el mouse. Votos, argumentos y compartir quedan como están.

### Calidad

- [ ] **TK-12** A 360 px entra sin scroll horizontal: el objetivo baja debajo del activo si no entra al lado.
- [ ] **TK-13** Sin violaciones de axe (WCAG 2.2 AA): el verde y el rojo del objetivo cumplen 3:1 sobre `--surface` en los dos temas (texto grande: 24 px en 800).
- [ ] **TK-14** Textos en en, es y pt.
- [ ] **TK-15** El presupuesto de JS no sube: el ticket es un Server Component.

## Dependencias

- **Logo del activo:** el backend no manda el logo en `thesis.asset`. Hasta que lo mande (propuesta **P-041**: `asset.logoUrl`), se usa el avatar de la comunidad cuando la tesis está en la comunidad del activo y, si no, las iniciales.

## Fuera de alcance

- El precio actual del activo en la tarjeta (necesita una cotización por tarjeta).
- Bull/Bear del prototipo: son los votos de hoy (`specs/thesis-detail`).
- El formulario de crear tesis.
