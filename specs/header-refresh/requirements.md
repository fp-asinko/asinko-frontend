# Barra superior simple y grises fríos — Requirements

> **Estado:** para aprobar. Pedido el 2026-10-05 con capturas de Reddit: "mucho más simple", el buscador centrado sobre el contenido, "siempre minimalista", y el gris de Reddit (`#F6F8F9`) en la mayoría de los fondos.
> **Referencia:** la barra de Reddit sin sesión:
>
> - El logo.
> - El buscador centrado sobre la columna del feed.
> - A la derecha, "Regístrate" (píldora gris), "Iniciar sesión" (píldora de color) y un menú "⋯" con los ajustes ("Modo de visualización").

## Objetivo

Una barra con lo mínimo, alineada con el contenido, y una paleta de grises más limpia y con mejor contraste.

## Criterios de aceptación

### Barra

- [ ] **HR-01** **Buscador centrado sobre el feed:** desde `md`, el buscador queda centrado sobre la columna central (no sobre la página) y ocupa su ancho, hasta 560 px como en Reddit. Hoy está centrado en la página y mide 264 px.
- [ ] **HR-02** **Lo mínimo a la derecha.** Sin sesión, "Sign up" (píldora gris), "Log in" (píldora principal) y "⋯". Con sesión, la campana, el perfil y "⋯". Sale el botón "Tokens": la tarjeta de la columna derecha ya lo explica.
- [ ] **HR-03** **Menú "⋯":** reúne el idioma y el modo oscuro en todos los tamaños. Se opera con teclado, como un menú accesible. En mobile, sin sesión, suma "Sign up", que no entra en la barra.
- [ ] **HR-04** **Mobile (360 px):** menú ☰, logo, buscar, "Log in" y "⋯", sin desbordar. El idioma y el tema salen del panel ☰ (vuelven al "⋯"), así el panel queda solo con las comunidades.

### Paleta

- [ ] **HR-05** **Grises fríos** en tema claro:
  - `--surface` `#F6F8F9`: buscador, composer, panel de comentarios, tarjetas de la columna, hovers.
  - `--muted`, `--secondary` y `--accent` `#EEF1F3`: chips, píldoras grises, pista del voto.
  - `--border` `#E5E8EB` y `--border-strong` `#D5DADF`.
  - `--header` blanco.
  - El tema oscuro no cambia: ya es gris neutro.
- [ ] **HR-06** **Contraste:** todos los pares del test de contraste siguen en AA. Medidos con la fórmula del proyecto:
  - texto secundario sobre `--surface`: 6,18;
  - texto secundario sobre `--muted`: 5,80;
  - `--faint` sobre `--surface`: 3,20.

  El verde de las variaciones sigue solo sobre blanco (4,43 sobre `--surface`, igual que hoy).

### Generales

- [ ] **HR-07** Sin JS extra al cargar: el menú "⋯" se carga diferido. El JS del Home se queda en ≤ 230 KB.
- [ ] **HR-08** Textos en en, es y pt, y axe sin violaciones en claro y oscuro, en mobile y desktop.

## Fuera de alcance

- El buscador real (sigue "Coming soon") y el botón "Create" de Reddit, que llega con crear post.
- El color de marca: Reddit usa naranja y Asinko sigue monocromático (`--primary` casi negro).

## Preguntas abiertas

| #   | Pregunta                                                                             | Propuesta                                                                                           |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Q1  | Reddit tiene un ícono de traducción suelto en la barra. ¿Lo copiamos para el idioma? | **No:** el idioma va dentro de "⋯", con el modo oscuro. Menos íconos sueltos                        |
| Q2  | ¿La campana queda para quien tiene sesión?                                           | **Sí**, pero solo con sesión: sin cuenta no hay notificaciones. Sigue "Coming soon" hasta la fase 3 |
| Q3  | ¿Los grises fríos también en oscuro?                                                 | **No:** los grises oscuros ya son neutros y el cambio pedido es del tema claro                      |
