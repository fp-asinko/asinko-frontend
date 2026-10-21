# La columna izquierda llena su alto — Requirements

> **Estado:** borrador, para aprobar por el PO.
> **Fuente:** pedido del PO (2026-10-21), con capturas de la columna "Tus intereses" con mucho espacio blanco abajo y, con zoom, con scroll. Respuestas:
>
> - El orden pasa a ser Grupos, Personas, Activos (y Sugeridos al final).
> - Con alto de sobra, se llena con más ítems; con poco (zoom, pantallas bajas), cada sección muestra menos y lo que no entra queda en "more".
> - Si ni lo mínimo entra, la columna hace scroll; no se esconde ninguna sección entera.
>
> **Dato:** grupos, personas y activos ya muestran todo lo que la cuenta tiene. Con alto de sobra, lo que llena es **Sugeridos**.

## Objetivo

Que la columna se vea completa en cualquier pantalla y zoom: sin un hueco blanco abajo, y sin scroll mientras entre lo mínimo.

## Criterios de aceptación

### Orden

- [ ] **SF-01** Con sesión, las secciones van en este orden: **Grupos** (con "Crear grupo"), **Personas**, **Activos** y, después de la línea, **Sugeridos**. Sin sesión, como hoy (la invitación y Sugeridos).

### Llenar el alto

- [ ] **SF-02** **Sugeridos** ocupa el alto que queda y muestra todas las sugerencias que entran **enteras** (hasta 8). Nunca una a medias. Con sesión sigue siendo la última sección.
- [ ] **SF-03** Con poco alto, **Grupos**, **Personas** y **Activos** muestran menos ítems, en este orden de prioridad, y dejan "more" para el resto. Mínimos: 2 grupos, 1 persona, una fila de 3 activos y 1 sugerencia.
- [ ] **SF-04** Si con esos mínimos tampoco entra, la columna hace scroll (como hoy). Ninguna sección desaparece entera.
- [ ] **SF-05** Funciona igual con zoom del navegador y al cambiar el alto de la ventana, sin recargar. Sin JavaScript nuevo: lo resuelve CSS (`seo.md § Presupuesto`; la columna está en todas las rutas).

### Calidad

- [ ] **SF-06** Lo escondido no queda en el orden del teclado ni para lectores de pantalla (`display: none`, no solo recortado). Axe sin violaciones en claro y oscuro; textos sin cambios.

## Fuera de alcance

- La columna derecha y el panel lateral del teléfono (que ya hace scroll).
- Un orden de secciones elegido por cada persona.
