# Ventana de compartir — Design

## 1. Componentes

`ShareButton` pasa a carpeta (`src/components/molecules/share-button/`), con la ventana dentro de la misma molécula:

- `share-button.tsx`: con `post` (`{ title, preview }`), en desktop abre la ventana; sin `post` (un comentario, Q4) copia como antes. En el teléfono, el menú del sistema en los dos casos (SM-01). La ventana se carga con `next/dynamic` al primer uso y se precarga al pasar el mouse o enfocar (SM-07).
- `share-dialog.tsx`: `Dialog` de shadcn con la imagen para compartir del post (`next/image`, `unoptimized`: la ruta ya responde 1200 × 630), y una fila de opciones (círculo gris con la marca, el nombre debajo). El foco entra en "Copiar link" (`initialFocus`) y vuelve a Compartir (`finalFocus`).
- `share-targets.ts`: la URL de compartir de cada red, sin scripts de terceros (SM-03): `x.com/intent/post`, `wa.me/?text=`, `t.me/share/url`, `mailto:`.

## 2. Marcas

- X sale de `brand-marks.tsx` (ya está, la usa la ventana de cuenta).
- WhatsApp y Telegram van en `components/ui/share-marks.tsx`, aparte: `brand-marks.tsx` viaja con la ventana de cuenta en la primera carga, y Turbopack no descarta las exportaciones sin uso (medido: +0,8 KB en todas las rutas con las marcas ahí).

## 3. Datos

`post-card.tsx` pasa el título y `postImageRoute(id)` (`src/lib/share-image/share-metadata.ts`, sin el idioma: el botón le pone el de la página, igual que al link).

## 4. Tests

- Unitarios: `shareTargetUrl` (cada red, codificación), `ShareButton` con `post` (ventana, imagen con su `alt`, foco, links con `target` y `rel`, copiar, Esc devuelve el foco, el teléfono sigue con el menú del sistema).
- E2E `e2e/share-menu.spec.ts`: la ventana desde el detalle, la imagen cargada (1200 px), el link de X, copiar al portapapeles, Esc, el comentario sigue copiando, 360 px y axe en claro y oscuro.

## 5. Ajustes al implementar (2026-10-14)

- **Presupuesto (SM-07):** la ventana se carga al primer uso, pero el botón crece y la carga diferida suma su entrada al manifiesto de Turbopack: +0,4 KB en el Home y +0,2 KB en el detalle del post (239,1 de 240).
- **Del `ui-reviewer`:** el aviso de pestaña nueva va separado del nombre ("X (se abre en una pestaña nueva)"); las etiquetas reservan dos líneas, así "No se pudo copiar" no mueve la ventana a 360 px; una imagen que falla se quita en lugar de verse rota; el título usa clases sueltas (no `type-*` sobre las de `DialogTitle`). Quedan sin cambiar, aceptados: `aria-haspopup` también en teléfonos con menú del sistema, y la lógica de copiar repetida en el botón y la ventana (dos usos: se extrae al tercero).
