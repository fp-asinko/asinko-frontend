# El número de la tesis — Requirements

> Estado: **aprobado** por el PO el 2026-11-06, con Q1 respondida. Pedido del 2026-11-06: "un # con el número de thesis". Recomendado y aceptado en la conversación: **por autor**, no global (un número global entre miles de tesis no dice nada; por autor dice si es su primera apuesta o la cuadragésima).

## User stories

- Como lector, quiero ver qué número de tesis es para su autor, para saber si es alguien que recién empieza o que ya apostó muchas veces.
- Como autor, quiero que cada tesis lleve su número, como un boleto con su serie.

## Criterios de aceptación

- [ ] **TN-01** Cada tesis muestra su número entre las del autor: **"#12"** (la duodécima que publicó). Cuentan todas las publicadas, también las canceladas: el número no cambia nunca.
- [ ] **TN-02** Va **impreso grande y tenue** ("#12") a la derecha del talón de abajo, como la serie de un boleto de lotería (Q1). Por detrás del texto: el plazo y, cerrada, el sello del estado van por encima.
- [ ] **TN-03** En el feed, en la página de la tesis y en la pestaña "Tesis" del perfil.
- [ ] **TN-04** Accesible: el lector de pantalla lee "Tesis número 12 de maria", no "numeral 12".
- [ ] **TN-05** Sin el dato (el backend no lo manda) o en una tesis del sistema: no se muestra, y el ticket queda como hoy.
- [ ] **TN-06** Textos en en, es y pt.
- [ ] **TN-07** Propuesta al backend (P-047) y mock, con `API_MOCKS=true` y `missing`.

## Fuera de alcance

- Un número global de tesis.
- Hitos por número ("¡Tesis Nº 100!"): van con los logros (`specs/profile-achievements`).

## Decisiones del PO (2026-11-06)

| #   | Pregunta                    | Decisión                                                                                                                                                            |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | ¿Dónde y cómo va el número? | Se probaron un sello gris en el talón y una etiqueta negra en la esquina (2026-11-06); el PO eligió **la serie grande y tenue en el talón de abajo**, a la derecha. |

## Dependencias

- `specs/thesis-identity` (el ticket troquelado).
- Backend: **P-047**, `authorSequence` en el recurso `Thesis`: su orden entre las tesis publicadas del autor, desde 1.
