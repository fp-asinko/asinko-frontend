# Navegación del feed sin esperas a ciegas — Requirements

> **Estado:** aprobado el 2026-10-05 por el Product Owner ("dale hagamos eso"), con el enfoque medido y propuesto en la conversación.
> **Medición (2026-10-05, datos reales de `asinko-app` dev):**
>
> | Qué                                   | Tiempo |
> | ------------------------------------- | ------ |
> | Backend, feed "For you"               | 12 s   |
> | Backend, encuestas                    | 6 s    |
> | Nuestra página con mocks, sin backend | 0,04 s |
>
> El render del front no pesa: todo es espera del backend. Además, un clic en "Polls" dejó la vista **congelada 6,4 s, sin ninguna señal**. La URL no cambió, no apareció el esqueleto y la pestaña no se marcó.

## Objetivo

Que cambiar de pestaña o de filtro responda al instante aunque el backend tarde, y que volver a algo recién visto no espere de nuevo. La causa de fondo, la lentitud del backend, va como propuesta P-009.

## Criterios de aceptación

- [ ] **FN-01** **Respuesta inmediata:** al tocar una pestaña ("For you" o "Following"), un filtro ("New" o "Polls") o una comunidad, la URL cambia, la pestaña o el filtro se marcan y aparece el esqueleto de la lista en menos de 300 ms, sin esperar al backend.
- [ ] **FN-02** **La parte de arriba no parpadea:** el composer, las pestañas y los filtros quedan en pantalla mientras carga la lista; solo la lista muestra el esqueleto. El chip de la comunidad filtrada aparece cuando llega su nombre.
- [ ] **FN-03** **Lectores de pantalla:** la carga se anuncia ("Loading…").
- [ ] **FN-04** **Volver es instantáneo:** volver a una combinación de pestaña y filtro visitada en los últimos 30 s se muestra al momento, desde el caché del router de Next (`staleTimes.dynamic`).
- [ ] **FN-05** **Primera carga en streaming:** la página llega con la parte de arriba y el esqueleto, y la lista entra cuando el backend responde.
- [ ] **FN-06** **Sin peso extra:** el JS del Home se queda en ≤ 230 KB.
- [ ] **FN-07** **Propuesta al backend:** P-009 en `proposals.md`, con la medición, el pedido de armar el feed en pocas consultas y el de desplegar en la misma región que la base.

## Fuera de alcance

- Precargar pestañas en segundo plano (`prefetch` completo): con el backend actual, cada precarga serían 6 a 12 s de carga extra en una base con 5 conexiones.

## Riesgo aceptado

- **Caché de 30 s (FN-04):** si alguien vota en una pestaña y vuelve antes de 30 s a otra que ya había visitado, esa otra muestra los votos del momento en que la vio. Se acepta a cambio de volver al instante; si molesta, se baja `staleTimes.dynamic` a 0.
