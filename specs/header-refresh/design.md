# Barra superior simple y grises fríos — Design

> **Estado:** aprobado el 2026-10-05.

## 1. Alineación con el contenido (HR-01)

La barra usa la misma grilla que `AppShell`: la izquierda de 260 px desde `md`, y después el centro (hasta 780 px) y la derecha (300 px) centrados juntos. El buscador vive en la celda del centro, así su centro coincide con el del feed a cualquier ancho:

```
md+:  [ logo 260 ][        centro (max 780)        ][ derecha 300 ]
                        [ buscador ≤ 560 ]
      acciones: fijas al borde derecho de la ventana, encima de la grilla (como Reddit)
```

- Las acciones van con `absolute right-4` dentro de la barra, para no correr el buscador.
- Si a un ancho intermedio (`md`, 768–1023 px) el buscador y las acciones se tocan, el buscador se achica: es `flex-1` con `max-w-140`. Lo verifica un e2e a 768 px.
- `ComingSoon` del buscador: el `span` que lo envuelve pasa a ocupar el ancho (`flex-1`). Hoy queda `inline-flex` de 264 px.

## 2. Acciones (HR-02, HR-03)

| Sesión | Mobile (< md)       | Desde md             |
| ------ | ------------------- | -------------------- |
| No     | buscar · Log in · ⋯ | Sign up · Log in · ⋯ |
| Sí     | buscar · ⋯          | campana · perfil · ⋯ |

- **Sign up:** `rounded-full bg-muted` (la píldora gris de Reddit). **Log in:** `rounded-full bg-primary`. Los dos con 44 px de alto en mobile y 36 px desde `md` (G-02 de `guest-experience`).
- **"⋯":**
  - Usa el `DropdownMenu` de shadcn (Base UI `Menu`, se agrega con el CLI). Se carga diferido con `next/dynamic` y el disparador es un botón de 40 px con `aria-label` "More options".
  - Contenido: "Language" con las tres opciones como radio, "Dark mode" como item con check (`menuitemcheckbox`) y, sin sesión y solo en mobile, "Sign up".
  - Reemplaza a `LocaleSwitcher` y `ThemeToggle` en la barra y en el panel ☰ (`MenuSettings` se borra). Las moléculas se adaptan o se reemplazan por items del menú. La lógica (cambiar de idioma sin perder los filtros, next-themes) no cambia.

## 3. Paleta (HR-05, HR-06)

| Token                                | Hoy       | Nuevo     |
| ------------------------------------ | --------- | --------- |
| `--surface`                          | `#F7F6F4` | `#F6F8F9` |
| `--muted`, `--secondary`, `--accent` | `#F1F0ED` | `#EEF1F3` |
| `--border`                           | `#ECEBE7` | `#E5E8EB` |
| `--border-strong`                    | `#D9D8D4` | `#D5DADF` |
| `--header`                           | `#FCFCFB` | `#FFFFFF` |

- Solo `:root`. `.dark` no cambia.
- `design-system.md § Tokens de Asinko` pasa de "grises cálidos" a "grises fríos".
- El test de contraste no suma pares: los existentes cubren los usos.

## 4. Tests

- **Unitarios:**
  - `site-header.test.tsx`: las acciones con y sin sesión, sin "Tokens".
  - El menú "⋯": idioma, modo oscuro y "Sign up" en mobile.
  - Se borra `menu-settings.test.tsx`.
- **e2e:**
  - El buscador centrado sobre `main` (±1 px) a 1440, 1280 y 1024 px.
  - Sin desborde a 360 px en `es` y a 768 px.
  - `theme.spec` e `i18n.spec` usan el "⋯" (`e2e/fixtures/settings.ts`).
  - axe en claro y oscuro.
- **Contraste** (`tokens-contrast.test.ts`) y presupuesto de JS.

## 5. Ajustes de la implementación

- **Grilla de la barra:** desde `lg` usa `lg:gap-0`. El `gap` de la fila corría la celda central 8 px y el buscador quedaba 4 px fuera del centro del feed. Lo detectó el e2e de centrado.
- **360 px en español** ("Iniciar sesión" es largo): en mobile, las píldoras usan `px-3`, el logo `px-1` y la fila `gap-1`. El e2e lo verifica.
- **"Sign up" en "⋯":** se renderiza solo si al abrir el menú la pantalla es angosta (`matchMedia`), así nunca hay un item oculto en el recorrido con teclado. El menú se precarga cuando el puntero o el foco llegan a "⋯".
- **`dropdown-menu.tsx`** (shadcn, Base UI), con comentarios `asinko:`:
  - `anchor`, para abrir desde el botón diferido.
  - Anillo de foco visible en los items: el fondo de acento solo da ~1,1:1.
  - Sin sombra.
  - Apertura en 200 ms y cierre en 150 ms.
- **Botones de cuenta:** "Sign up" usa la variante `secondary` (la píldora gris), sin clases repetidas.
- **Se borraron** `LocaleSwitcher`, `ThemeToggle`, `MenuSettings` y `ui/switch.tsx`, que quedaron sin uso.
- **HR-09, el gris en toda la app** (pedido al ver la primera versión):
  - Las acciones de las tarjetas son píldoras grises sin borde.
  - Las opciones de las encuestas son cajas grises.
  - El composer va sin borde.
  - Token nuevo: `--muted-hover` (`#E3E7EA` en claro y `#303136` en oscuro).
