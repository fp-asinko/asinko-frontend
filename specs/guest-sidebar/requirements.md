# Invitación a unirse en la columna izquierda — Requirements

> **Estado:** aprobado por el PO el 2026-10-05.
> **Pedido del Product Owner** (con captura de Reddit): "pasar el que tenemos a la derecha a la izquierda, mejorarlo con lo que tenemos de Reddit y abajo poner lo de los grupos… un fondo minimalista en vez de la imagen que usa Reddit".
> **Decisiones tomadas con el PO:**
>
> - Las redes del modal más correo.
> - Fondo de menciones flotando.
> - En la columna izquierda y en el panel mobile; se va de la derecha.

## Objetivo

Que un visitante sin cuenta vea, en el lugar donde un usuario ve sus intereses, una invitación clara a sumarse, como Reddit. Debajo siguen las comunidades, así la columna no queda vacía.

## Criterios de aceptación

- [ ] **GS-01** **Ubicación:**
  - Sin sesión, la columna izquierda empieza con una tarjeta de invitación, y debajo siguen las "Comunidades" de hoy.
  - En mobile, igual dentro del panel ☰.
  - Con sesión, la columna no cambia.
- [ ] **GS-02** **Contenido de la tarjeta, de arriba hacia abajo:**
  - Título "¿Nuevo en Asinko?" y el texto de valor actual (las claves de `authGate.joinCard`, ya traducidas).
  - Cuatro botones a lo ancho, con el logo a la izquierda: **Continuar con Reddit**, **con Instagram**, **con X** y **con correo**.
  - El texto legal: "Al continuar, aceptas nuestros Términos y la Política de privacidad".
- [ ] **GS-03** **Los botones son "Próximamente"** hasta la spec `auth`, como los del modal (H-26, G-13). Los links legales también, como los del pie.
- [ ] **GS-04** **Fondo:** al pie de la tarjeta, menciones sueltas (`$BTC`, `#defi`, `@maria`…) en píldoras grises que se desvanecen hacia arriba. Es decorativo: no se lee ni se enfoca, no usa imágenes y no tiene animación.
- [ ] **GS-05** **Columna derecha:** sin sesión ya no muestra "¿Nuevo en Asinko?" (G-03 pasa a la izquierda). Quedan los tokens y el pie, igual que con sesión.
- [ ] **GS-06** **Mobile y accesibilidad:**
  - A 360 px, dentro del panel, no hay scroll horizontal y los textos de los botones entran en una línea en los tres idiomas.
  - Botones de 44 px de alto.
  - La tarjeta es una sección con el título como nombre.
  - Pasa axe en claro y oscuro.
- [ ] **GS-07** El JS de primera carga sigue dentro de los 230 KB (`seo.md`).
- [ ] **GS-08** Textos nuevos (el botón de correo y el texto legal) en en, es y pt.

## Fuera de alcance

- El login real y los proveedores: spec `auth`. Supabase no tiene Reddit ni Instagram nativos (`guest-experience § 9`).
- Las páginas de Términos y Privacidad.
