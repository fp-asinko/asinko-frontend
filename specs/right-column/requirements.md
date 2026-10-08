# Columna derecha — Requirements

> **Estado:** aprobado el 2026-10-04 con Q1–Q3 como se proponen. Pedido el 2026-10-04. Reemplaza H-08 de `specs/home` (columna derecha vacía en el MVP).
> **Fuente de verdad:** la columna `sidebar-right` de `docs/references/prototype.html`, medida en el navegador a 1440 px.

## Objetivo

Que la tercera columna deje de estar vacía y siga el prototipo, sin prometer lo que todavía no existe. El prototipo tiene tres bloques:

1. Tokens de temporada.
2. "Recently viewed".
3. Pie con links legales.

El Product Owner decidió, el 2026-10-04:

- **Tokens:** se muestran como "Próximamente". Son de la fase 4 y requieren validación legal.
- **"Recently viewed":** espera al detalle de post (`post-detail`). **Hecho el 2026-10-08 en `specs/recently-viewed`.**
- **Pie:** los links se muestran como "Próximamente" hasta que existan las páginas.

## User stories

1. Como **usuario**, quiero saber que Asinko va a tener tokens de temporada y para qué sirven, sin que parezca que ya tengo un saldo.
2. Como **usuario**, quiero encontrar las reglas, la privacidad y los términos en el lugar de siempre, aunque todavía no estén publicados.

## Criterios de aceptación

- [x] **RC-01** **Columna con contenido:** desde `lg` (1024 px), la columna derecha de 300 px muestra la tarjeta de tokens y el pie, en ese orden. Queda fija al hacer scroll, como la izquierda, y si no entra en la pantalla tiene scroll propio.
- [x] **RC-02** **Tokens de temporada como "Próximamente":** la tarjeta tiene el estilo del prototipo, con fondo `--surface`, borde, radio de 12 px, el título "Season tokens" y la explicación de cómo se ganan y se gastan. No muestra saldo, temporada ni días restantes (Q1). Un sello "Coming soon" deja claro que todavía no existe.
- [x] **RC-03** **Pie:** muestra Rules, Privacy, Terms, Accessibility, About, Careers y Press, más el copyright. Cada link funciona como un elemento deshabilitado de H-26: se puede enfocar, se anuncia como no disponible y al activarlo muestra "Coming soon".
- [x] **RC-04** **Accesibilidad:**
  - La columna es una región complementaria con nombre (`aside`), porque ahora tiene contenido.
  - Los textos cumplen AA: el prototipo usa 10–10,5 px en gris `#8A8B8E`; acá van con la escala tipográfica del sistema (`type-meta`) y `--muted-foreground`.
  - Se opera con teclado y no tapa el foco.
- [x] **RC-05** **Mobile first:** en mobile y tablet (menos de 1024 px) la columna no se muestra, igual que en el prototipo. El contenido es informativo y "Próximamente", así que no falta nada indexable (`seo.md § Mobile first indexing`).
- [x] **RC-06** **i18n:** todos los textos están en en, es y pt (ver Q2 para la explicación de los tokens).
- [x] **RC-07** **Sin peso:** todo se renderiza en el servidor. El único JavaScript es el de los botones "Coming soon", que ya existe. El JS del Home se queda en ≤ 230 KB.

## Fuera de alcance

- "Recently viewed", que llega con `post-detail`.
- Saldo real, temporadas y la economía de tokens (fase 4).
- Las páginas legales y su acceso en mobile: cuando existan, sus links se suman también al panel lateral de mobile.

## Preguntas abiertas

| #   | Pregunta                                                                                                                                                                                                                                     | Propuesta                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | El prototipo muestra un saldo ("2,450 season tokens"), "Season 3 · ends in 18d" y una barra de progreso. ¿Los mostramos con datos de ejemplo?                                                                                                | **No.** Un número parece un saldo real, y la barra superior ya muestra "Tokens" sin cifra. La tarjeta explica qué son y lleva el sello "Coming soon"                                                                                                                                                                                                                                                     |
| Q2  | La explicación es copy de producto ("Earn by viewing ads, engagement and correct calls. Spend to post — hot cashtags cost more. Resets each season: use it or lose it."). La guía de i18n pide no inventar traducciones de copy de marketing | En inglés, el texto del prototipo. Traducciones propuestas, para aprobar: **es** "Ganalos viendo anuncios, participando y acertando. Gastalos para publicar: los cashtags más buscados cuestan más. Se reinician cada temporada: usalos o perdelos." · **pt** "Ganhe vendo anúncios, participando e acertando. Gaste para publicar: cashtags em alta custam mais. Zeram a cada temporada: use ou perca." |
| Q3  | Copyright: el prototipo dice "Asinko, Inc. © 2026". ¿Existe esa razón social?                                                                                                                                                                | Usar **"© 2026 Asinko"** sin "Inc." hasta confirmar el nombre legal. El año sale de la fecha actual                                                                                                                                                                                                                                                                                                      |

## Dependencias

- `specs/home` cerrado. H-08 pasa a decir "ver `specs/right-column`".
- `ComingSoon` (H-26) y la escala tipográfica de `design-system.md`.
