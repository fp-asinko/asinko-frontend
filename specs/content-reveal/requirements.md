# Contenido que llega con un fade — Requirements

> **Estado:** aprobado por el PO el 2026-11-07 ("cuando termina un contenido de cargar aparece de golpe, podríamos agregar un fade in leve"). Alcance elegido: lo que reemplaza un skeleton; el feed entra todo junto, sin cascada.

## Objetivo

Que lo que termina de cargar no aparezca de golpe: un fade de opacidad corto cuando el contenido reemplaza a su skeleton.

## Criterios de aceptación

- [ ] **CR-01** Todo contenido que llega después de la página y reemplaza un skeleton entra con un fade de opacidad de 200 ms (`--animate-fade-in`, `ease-out`), sin movimiento:
  - los feeds (Home, grupo, activo, perfil) y el chip del grupo filtrado;
  - la columna de intereses;
  - los comentarios de un post y los argumentos de una tesis, con sus anuncios;
  - el gráfico y las novedades de una tesis;
  - las tesis y las respuestas del perfil;
  - la columna derecha de crear post;
  - los formularios diferidos: el editor de crear post, los de la cuenta y los recortes de imágenes.
- [ ] **CR-05** El Home, que pasa por el skeleton de toda la página (`(main)/loading.tsx`): el composer, las pestañas y el feed entran juntos con el mismo fade (PO, 2026-11-07). Es la única página con ese skeleton; su LCP, el primer post, ya entraba con el fade.
- [ ] **CR-02** Los primeros posts del feed entran todos juntos, no en cascada. "Cargar más" sigue como está (`stagger`).
- [ ] **CR-03** Con "reducir movimiento", aparece al instante, como hoy toda animación (regla global de `globals.css`).
- [ ] **CR-04** Sin JavaScript nuevo: el presupuesto de ninguna ruta crece. El layout no cambia: ni espacios ni alturas.

## Fuera de alcance

- Cada cambio de página en general, por su efecto en el LCP (el Home sí, CR-05).
- Las imágenes (avatares, banners, fotos): harían falta componentes cliente en rutas que están en el tope.
