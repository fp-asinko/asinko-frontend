# Visto recientemente — Requirements

> **Estado:** borrador para el PO (2026-10-08), con sus decisiones (abajo) y una pregunta (Q1).
> **Fuente:** pedido del PO (2026-10-08), con una captura del prototipo: "vamos a trabajar en la columna derecha, para agregar el recently viewed". Ya estaba previsto en `specs/right-column` ("espera al detalle de post"), que hoy existe.

## Objetivo

Volver en un toque a lo que se estuvo leyendo: la columna derecha lista los últimos posts abiertos, como el prototipo y Reddit.

## User stories

- Como usuario, quiero volver a un post que leí hace un rato sin buscarlo.
- Como usuario, quiero poder borrar esa lista.

## Criterios de aceptación

- [ ] **RV-01** En la columna derecha (desde 1024 px, donde existe), arriba de "Season tokens", un bloque "Visto recientemente" con un botón "Borrar".
- [ ] **RV-02** Cada ítem: la comunidad donde se publicó (`$BTC`, `#macro`; en un canal personal, `@autor`) y hace cuánto lo viste ("12 min"), el título (hasta 2 líneas), los votos y los comentarios, y el tipo ("Post"). Todo el ítem lleva al post.
- [ ] **RV-03** Se registra al abrir la página de detalle de un post. El último abierto va primero; abrir uno que ya estaba lo sube y actualiza sus datos. Hasta 10. Un post borrado no se registra.
- [ ] **RV-04** Los votos y comentarios son los de la última vez que lo abriste (sin pedidos extra al servidor).
- [ ] **RV-05** Se guarda en el navegador: funciona sin cuenta, cada dispositivo tiene su lista, y "Borrar" la vacía. Sin nada visto, el bloque dice "Nada visto recientemente". Si el navegador no deja guardar (ventana privada), la lista simplemente no aparece y nada se rompe.
- [ ] **RV-06** Se actualiza sola: después de abrir un post y volver, ya figura; en otra pestaña también.
- [ ] **RV-07** Accesibilidad: el bloque es una sección con título; cada ítem es un link con un nombre que se lee completo (comunidad, título, cuándo); "Borrar" es un botón con nombre claro. axe sin violaciones, en claro y oscuro.
- [ ] **RV-08** Presupuesto de JS (`seo.md`, quedan 1,4 KB): la lista se descarga después de que carga la página y solo donde hay columna derecha; lo que registra la visita es mínimo. Si no entra, se consulta al PO antes de tocar el tope.
- [ ] **RV-09** Textos en en, es y pt.

## Fuera de alcance

- Sincronizar entre dispositivos (decisión del PO: en el navegador).
- Tesis, alertas y lives (llegan en las fases 2 y 3; el tipo ya queda previsto).
- Páginas de comunidad, activo y perfil en la lista.
- La columna derecha en mobile (no existe).

## Decisiones del PO (2026-10-08)

- **Guardado:** en el navegador.
- **Números:** los de cuando lo viste, actualizados al volver a abrirlo.
- **Alcance:** posts y encuestas, los últimos 10.
- **Presupuesto:** diferir la lista y medir; si no entra, preguntar.

## Pregunta para el PO

- **Q1. Encuestas:** hoy una encuesta no tiene página de detalle (se vota y se comenta en el feed), así que no hay un "abrirla" que registrar ni un lugar adonde llevar desde la lista. Propuesta: **por ahora solo posts**; las encuestas entran cuando tengan su página (se arma en otra spec si la querés). **Recomendado.** Alternativa: registrar una encuesta al votarla o abrir sus comentarios, y que el ítem lleve al Home filtrado por su comunidad.
