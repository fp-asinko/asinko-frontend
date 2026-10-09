# Estados vacíos con imagen — Requirements

> **Estado:** aprobado por el PO el 2026-10-09: Q1, íconos en un círculo gris; Q2, los textos de la tabla.
> **Fuente:** pedido del PO (2026-10-09), con una captura de los comentarios vacíos ("No comments yet. Start the conversation."): "deberíamos mejorar con alguna imagen y texto en todos los casos donde no haya cierta información". Inspiración: Reddit ("Be the first to comment", con su ilustración), X e Instagram.

## Objetivo

Que un lugar sin datos no parezca roto: una imagen, un título que diga qué pasa y, cuando se puede, qué hacer.

## Criterios de aceptación

- [ ] **ES-01** El organismo `EmptyState` pasa a tener **imagen** (Q1), **título** en negrita, **descripción** en gris y una **acción** opcional (botón o link). Dos tamaños: **grande** para el contenido principal (centrado, con aire) y **compacto** para secciones y columnas (imagen chica al lado o arriba del texto).
- [ ] **ES-02** Se usa en todos los vacíos y errores de lista (tabla de abajo), con textos nuevos en en, es y pt. Cada uno dice qué pasa y, cuando existe, qué hacer.
- [ ] **ES-03** La imagen es decorativa (`aria-hidden`): el título y la descripción dicen todo. Monocromática, con los tokens del tema, se ve bien en claro y oscuro.
- [ ] **ES-04** El estado aparece sin saltos: ocupa un alto parecido al del contenido que reemplaza (sin CLS al llegar el dato) y entra con el `animate-fade-in` de siempre.
- [ ] **ES-05** A 360 px entra sin scroll horizontal; axe sin violaciones; presupuesto de JS sin cambios (las imágenes son SVG en línea, dibujadas en el servidor).

| Dónde                                         | Título                       | Descripción                                                                 | Acción                         |
| --------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------- | ------------------------------ |
| Comentarios del post                          | Sé el primero en comentar    | Nadie respondió todavía. Comparte lo que piensas y arranca la conversación. | Foco en la caja de comentario  |
| Búsqueda de comentarios sin resultados        | Sin resultados para «x»      | Prueba con otras palabras.                                                  | Ver todos los comentarios      |
| Feed Para vos vacío                           | Todavía no hay posts         | Cuando la comunidad publique, lo vas a ver acá.                             | Crear post                     |
| Feed Siguiendo sin seguir nada                | Todavía no sigues nada       | Sigue comunidades, activos y personas para armar tu feed.                   | Ver Para vos                   |
| Feed Siguiendo sin sesión                     | Tu feed, a tu medida         | Crea una cuenta para seguir comunidades, activos y personas.                | Crear cuenta                   |
| Filtro Encuestas vacío                        | No hay encuestas acá         | —                                                                           | Ver todo                       |
| Comunidad / activo / perfil sin posts         | Todavía no hay posts en #x   | Sé el primero en publicar.                                                  | Crear post (si puede publicar) |
| Tesis vacías                                  | Todavía no hay tesis         | (propio / de otro)                                                          | —                              |
| Seguidores / seguidos vacíos                  | (propio / de otro)           | —                                                                           | —                              |
| Recently viewed vacío                         | Nada visto todavía           | Los posts que abras van a aparecer acá.                                     | —                              |
| Activo sin datos de mercado                   | Sin datos de mercado todavía | Los precios llegan cuando haya un proveedor.                                | —                              |
| Columna izquierda (activos, personas, grupos) | (el texto de hoy)            | —                                                                           | — (compacto, imagen chica)     |
| Errores de lista (tesis, listas, comentarios) | No se pudo cargar            | Prueba de nuevo en un momento.                                              | Reintentar                     |

Los textos en español van con tú, como el resto de `es.json`; los de la tabla son una propuesta para revisar.

## Fuera de alcance

- Página 404 y error general (ya tienen su diseño).
- Listas de sugerencias (menciones, comunidades del editor): siguen con su línea de texto, porque son desplegables chicos.

## Preguntas resueltas (2026-10-09)

- **Q1. ¿Qué imagen?**
  - **Íconos de lucide en un círculo gris** (**recomendado**): coherente con el resto de la app (monocromática, mismos íconos), liviano, sin depender de diseño. Ej.: 💬 para comentarios, 🔍 para búsqueda, ✨ para el feed.
  - **Ilustraciones propias**, como el Snoo de Reddit: más personalidad, pero hacen falta los dibujos (los puedo hacer en SVG monocromático simple, o los pide al diseño).
- **Q2. Los textos de la tabla:** ¿van como están o querés revisarlos antes?
