# "more" de la columna izquierda — Design

## `MoreToggle` (molécula cliente, `components/molecules/more-toggle.tsx`)

`SidebarSection` lo dibuja en lugar del `ComingSoon`, con:

- `controls`: el id de la lista;
- `section`: el nombre de la sección;
- los textos "more" y "less".

Lo que hace:

- **Se ve solo si hay algo escondido** (SM-01). Al montarse, y cada vez que cambia el alto de la columna, cuenta los hijos de la lista con `display: none` (`getComputedStyle`). Lo mide con un `ResizeObserver` sobre la lista y su sección. Sin nada escondido y sin desplegar, no dibuja el botón. Desplegado, siempre lo dibuja, para poder volver.
- **Desplegar** (SM-02) pone `data-more="open"` en el botón, y la sección lo lee por CSS: `group/section` en la `<section>`, y las listas suman `group-has-data-[more=open]/section:[&>li]:block!` (en Activos, la grilla: `!` alcanza, porque `li` de grilla es `display: list-item` o `block` por igual). El `!` gana a las reglas `nth-child` de cada nivel de alto. Así cada lista sigue siendo un Server Component y no hace falta estado en ella.
- **Nombre** (SM-03): `aria-label` con el texto visible y la sección ("more: Groups", "ver más: Grupos"). Empieza con lo que se ve (WCAG 2.5.3) y se distingue de los otros dos "more". _Cambio al implementar: primero fue un `sr-only`, pero Chrome le metía un espacio antes de los dos puntos ("more : Groups")._
- **En el panel del teléfono** no hay alto que llenar (el panel hace scroll): solo el máximo de cada lista puede esconder algo, así que con pocos ítems no aparece "more". Es la regla de SM-01.
- Antes de hidratar no hay botón, como en `FitList`. Es una ventana corta: la columna ya está dibujada.

## Textos

| Clave                        | en   | es        | pt        |
| ---------------------------- | ---- | --------- | --------- |
| `interests.more` (ya existe) | more | ver más   | ver mais  |
| `interests.less`             | less | ver menos | ver menos |

`moreGroups`, `morePeople` y `moreAssets` salen: el nombre ahora es "more: <sección>".

## Peso

Una molécula cliente de unas 40 líneas en la columna, que está en el layout: llega a todas las rutas. Esperado: unos +0,3 KB. Sale `ComingSoon` de la columna, pero sigue en otros lugares.
