# Columna derecha — Design

> **Estado:** aprobado el 2026-10-04.

## 1. Estructura

```
AppShell (organism)
└── right: ReactNode            ← nuevo slot, igual que `sidebar`
    app/[locale]/layout.tsx le pasa <RightColumn />
        ├── SeasonTokensTeaser  (components/organisms/right-column/)
        └── SiteFooter          (components/organisms/right-column/)
```

- **Por qué en el layout y no en la página:** en el prototipo la columna es parte del shell de todas las vistas de contenido, igual que la izquierda.
- **Por qué en `components/organisms`:** no tienen lógica de negocio ni datos. Son textos y botones "Próximamente". Cuando lleguen los tokens reales (fase 4), la tarjeta pasa a un feature `economy` y recibe los datos por props.
- **`AppShell`:**
  - El `div` vacío pasa a ser `<aside aria-label={t('rightColumn.label')}>` ("More from Asinko").
  - Clases: `sticky top-15 hidden h-[calc(100dvh-3.75rem)] w-75 shrink-0 overflow-y-auto border-l lg:block`, como la columna izquierda: queda fija debajo de la barra de 60 px y tiene scroll propio si no entra.
  - Si no recibe `right`, se mantiene el `div` vacío actual, así la estructura no cambia en vistas sin columna.

## 2. Tarjeta de tokens (RC-02)

| Pieza         | Prototipo                                                            | Implementación                                                                                                                             |
| ------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Contenedor    | margen 14 px; `#F7F6F4`, borde `#ECEBE7`, radio 12 px, padding 14/16 | `m-3.5 rounded-lg border bg-surface px-4 py-3.5`                                                                                           |
| Encabezado    | "SEASON 3" 11 px/800 mayúsculas + "ends in 18d" 10 px                | `<h2 class="type-section">` "Season tokens" y, a la derecha, el sello "Coming soon" (`rounded-full bg-muted px-2 type-meta font-semibold`) |
| Ícono         | Hexágono 16 px                                                       | `HexagonIcon` de lucide, 16 px, `aria-hidden` (el mismo ícono que el botón de tokens del prototipo)                                        |
| Saldo y barra | "2,450 season tokens" 22/800 y barra de 5 px                         | **No se muestran** (Q1)                                                                                                                    |
| Explicación   | 10,5 px `#8A8B8E`; "use it or lose it." en negrita                   | `type-meta text-muted-foreground` con `t.rich` para la negrita del final (`<strong>`)                                                      |

- **No es interactiva:** no hay nada para activar. El sello "Coming soon" es texto, no un botón.
- **No usa `ComingSoon`:** ese componente es para controles (H-26), y esta tarjeta solo explica algo que todavía no existe.

## 3. Pie (RC-03)

- `<footer>` dentro del `aside`. No es el `contentinfo` de la página, porque está anidado.
- Lista `ul` en línea (`flex flex-wrap gap-x-3 gap-y-1`) con un `ComingSoon` por ítem: `type-meta text-muted-foreground hover:text-foreground`, con `placement="above"`, que abre hacia arriba porque el pie está al final de la columna.
- Copyright: `type-meta text-muted-foreground`, "© {year} Asinko" (Q3). `year` sale de `getNow()` de next-intl en el servidor, que ya es la fuente de "ahora" del proyecto.
- Padding como el prototipo: `px-3.5 py-4`, con un `border-t` arriba.

## 4. Mensajes (en)

| Clave                          | en                                                                                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rightColumn.label`            | `More from Asinko`                                                                                                                                   |
| `rightColumn.tokens.title`     | `Season tokens`                                                                                                                                      |
| `rightColumn.tokens.badge`     | `Coming soon`                                                                                                                                        |
| `rightColumn.tokens.body`      | `Earn by viewing ads, engagement and correct calls. Spend to post — hot cashtags cost more. Resets each season: <strong>use it or lose it.</strong>` |
| `rightColumn.footer.links.*`   | `Rules`, `Privacy`, `Terms`, `Accessibility`, `About`, `Careers`, `Press`                                                                            |
| `rightColumn.footer.copyright` | `© {year} Asinko`                                                                                                                                    |

- Las traducciones de es y pt salen de Q2.
- Ningún namespace nuevo va al cliente: todo se renderiza en el servidor, y `ComingSoon` recibe la etiqueta como prop.

## 5. Tests

- `season-tokens-teaser.test.tsx`: título como encabezado, sello "Coming soon", sin cifras (ningún número en el texto) y la negrita del final.
- `site-footer.test.tsx`: los 7 ítems como botones `aria-disabled` y el copyright con el año.
- `app-shell.test.tsx`: con `right` hay un `complementary` con nombre; sin `right`, no hay región.
- e2e (`e2e/right-column.spec.ts`, solo desktop):
  - La columna se ve a 1280 px y no a 360 px.
  - Sigue visible después de hacer scroll en el feed (sticky).
  - Un link del pie muestra "Coming soon".
  - axe sin violaciones.
- Presupuesto de JS: `performance.spec.ts`.

## 6. Ajustes de la implementación

- **Globo "Coming soon" recortado (revisión de UI):** a 1024 px, el globo de "Rules" y el de "Careers", que abren cada fila del pie, quedaban cortados por el borde izquierdo de la columna. La columna tiene `overflow-y: auto` y eso también recorta en horizontal. Qué link abre cada fila depende del idioma, así que no sirve elegir la posición del globo link por link. Ahora `ComingSoon`, al mostrarse, mide el globo y lo corre hacia adentro lo justo si lo cortaría el contenedor o la pantalla. Lo cubre un unitario y `e2e/right-column.spec.ts`; verificado en en y es.
- **Tuteo en español:** las traducciones de Q2 estaban en voseo ("Ganalos… usalos o perdelos") y el resto de `es.json` usa tuteo. Quedó "Gánalos… Gástalos… úsalos o piérdelos".
- **`RightColumn`** tiene su test, con el orden de RC-01. El `id` del título de la tarjeta sale de `useId`. RC-05 se prueba a 360, 768 y 1023 px.
- **El año del copyright** sale de `useNow()` de next-intl en el servidor, la misma fuente de "ahora" que el resto de la app.
- **Los links del pie** se ven atenuados como todo lo que es "Próximamente" (H-26). WCAG 1.4.3 exime a los controles inactivos.
