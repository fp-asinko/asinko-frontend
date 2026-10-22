# Requirements: flujo de "Editar perfil"

> **Estado:** aprobado por el PO el 2026-10-22. Decisiones del PO del mismo día: las imágenes se guardan al aplicar, Cancelar y Guardar en un pie fijo, la cámara sobre las imágenes, campos en 3 secciones.
>
> **Hoy** (`specs/profile-presentation` PP-05 a PP-08): una ventana con todo seguido. "Aplicar" en el recorte solo muestra la imagen en la ventana; un único **Save** arriba manda todo. Si se cierra sin guardar, la foto nueva se pierde, y no queda claro que hacía falta guardar (lo reportó el PO).

## User stories

- Como usuario, quiero que la foto o el banner que acabo de recortar quede puesto, sin tener que acordarme de otro botón.
- Como usuario, quiero ver claramente qué falta guardar y dónde está el botón para hacerlo.
- Como usuario, quiero una ventana ordenada, donde encuentre cada dato rápido.

## Criterios de aceptación

### Imágenes (reemplaza el guardado de PP-07 y PP-08 para la foto y el banner)

- [x] **EF-01** Sobre el banner hay un botón redondo con una cámara ("Change banner"), y otro sobre la foto ("Change photo"). Cada uno abre un menú: **Upload image** (elige el archivo y pasa al recorte, como hoy) y **Remove** (solo si hay una imagen). Ya no está la fila de píldoras debajo.
- [x] **EF-02** **Apply** en el recorte sube la imagen **y la guarda en el perfil** en el mismo paso. Mientras tanto dice "Saving…"; al terminar, la ventana vuelve al formulario con la imagen nueva, anuncia "Photo updated" o "Banner updated" (sin mover el foco) y el perfil de atrás ya la muestra.
- [x] **EF-03** **Remove** pide confirmación ("Remove your photo?" / "Remove your banner?") y, al confirmar, guarda en el acto: vuelve el degradé o las iniciales, con el mismo aviso.
- [x] **EF-04** Si subir o guardar falla, la imagen anterior sigue en la ventana y en el perfil, y se dice el error junto a las imágenes. Lo escrito en los demás campos no se pierde.
- [x] **EF-05** Los cambios de imagen ya guardados no cuentan como "sin guardar": cerrar la ventana después de cambiar solo la foto cierra sin preguntar.

### Botones

- [x] **EF-06** Arriba: el título y la × (cerrar). Abajo, en un pie fijo que no se va con el scroll: **Cancel** y **Save**. En el teléfono, el pie respeta el área segura de abajo y queda visible sobre el teclado.
- [x] **EF-07** **Save** está atenuado (`aria-disabled`) hasta que cambie algún texto, la ubicación, "Open to" o los links. Atenuado no hace nada; con cambios, guarda solo eso y cierra (como PP-08). Mientras guarda dice "Saving…".
- [x] **EF-08** Cancel, × o Esc con cambios sin guardar piden confirmación, como hoy.

### Orden

- [x] **EF-09** Tres secciones con título: **Profile** (banner y foto, nombre, titular, ubicación), **About you** (bio, "Open to") y **Links**. "Show 'Complete your profile'" queda al final, como hoy. En el teléfono van una debajo de la otra, separadas por una línea. **Desde `md`, dos columnas** en una ventana más ancha (hasta 880 px): Profile a la izquierda; About you y Links a la derecha, separadas por una línea vertical. Así entra sin scroll en una pantalla de 1024×768 o más (pedido del PO, 2026-10-22).
- [x] **EF-10** Si un aviso del perfil abre la ventana en la foto o el banner (PP-04), el foco va a su botón de cámara.

- [x] **EF-12** Abrir y cerrar la ventana sin tirones (pedido del PO, 2026-10-22). La página de atrás no se difumina: lleva un velo más oscuro en su lugar. Los botones de cámara tampoco usan difuminado. El navegador lo recalculaba en cada cuadro de la animación.

### Transversales

- [x] **EF-11** Textos en en, es y pt. Teclado completo (el menú de la cámara, con flechas y Esc). Sin violaciones de axe con el menú abierto, en claro y oscuro. A 360 px, sin scroll horizontal y con el pie visible.

## Fuera de alcance

- Cambiar los campos, sus límites o el recorte en sí (PP-05, PP-07).
- Guardar cada campo de texto por separado.

## Dependencias

- `PATCH /users/{userId}` con `avatarUrl` (real, E01) y `bannerUrl` (mock, P-020): un pedido por imagen, con solo ese campo.
- `uploadProfileImage` (P-021, mock), sin cambios.
