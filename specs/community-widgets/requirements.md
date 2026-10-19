# El grupo como una página web: banner ancho y widgets, como Reddit — Requirements

> **Estado:** aprobado por el PO el 2026-10-19: "en los grupos quiero trabajar en la parte visual, la idea es que un moderador sienta que sea una página web, que tenga varias cosas para personalizar". Q1: la columna derecha de cada página muestra **lo de su grupo** (un grupo y el detalle de un post de ese grupo, sus widgets; un activo, sus datos de mercado; el perfil, su tarjeta); Season Tokens y "Vistos recientemente" quedan **solo en el Home**. Q2: widgets de **Texto, Reglas, Botones y Lista de comunidades**. Q3: también **Imágenes y Calendario** en esta versión. Q4: se ordenan **arrastrando y con flechas**.
> **Fuente:** capturas de un grupo de Reddit (banner a lo ancho de las dos columnas, "Editar widgets", "Añadir widget").
> **Backend:** no hay widgets ni subida de imágenes de un grupo. Se proponen (P-028, P-029) y se mockean.
> **Después:** la etiqueta de publicación como widget, la "Guía de moderación", "Desarrolla tu comunidad" y el modo moderación de los posts.

## Objetivo

Que la página de un grupo se sienta como su sitio: un banner que la abre de lado a lado y una columna derecha que el moderador arma con lo que quiere mostrar.

## User stories

- Como moderador, quiero agregar, editar, ordenar y quitar bloques en la columna derecha de mi grupo (texto, reglas, botones, comunidades, imágenes, eventos), para que se vea como la página de mi comunidad.
- Como visitante, quiero ver de un vistazo de qué se trata el grupo, sus reglas, sus links y sus próximos eventos.
- Como usuario, quiero que la columna derecha me hable de lo que estoy viendo, no siempre de lo mismo.

## Criterios de aceptación

### El banner, a lo ancho (desde desktop)

- [ ] **CW-01** En la página de un grupo, desde `lg`, el banner, el avatar, el nombre y las acciones (Crear post, Unirse o la estrella) ocupan el ancho de las dos columnas, como Reddit. Debajo, el feed a la izquierda y la columna derecha al lado. En el teléfono y la tablet se ve como hoy, de arriba hacia abajo.

### La columna derecha de cada página (Q1)

- [ ] **CW-02** El **Home** sigue con Season Tokens y "Vistos recientemente". En las demás páginas no aparecen.
- [ ] **CW-03** Un **grupo** muestra sus widgets (CW-05). El **detalle de un post** de un grupo muestra los widgets de ese grupo. Un **activo** muestra su ficha con los datos de mercado. El **perfil** muestra su tarjeta sin "Vistos recientemente". El resto (404, crear post ya tiene la suya) muestra solo el pie.
- [ ] **CW-04** Por debajo de `lg` no hay columna derecha. En la página del grupo, los widgets van en un desplegable **"Acerca de la comunidad"** debajo de la cabecera, cerrado al entrar. Así el contenido es el mismo en mobile y desktop.

### Los widgets (Q2, Q3)

- [ ] **CW-05** Arriba de todo, siempre, **Detalles de la comunidad**: nombre, descripción, cuándo se creó, miembros y si es pública. No se mueve ni se borra.
- [ ] **CW-06** Después, los widgets del grupo, en el orden que eligió el moderador (hasta 20):
  - **Texto:** un título y un cuerpo con Markdown simple (negrita, itálica, listas, links), como el cuerpo de un post.
  - **Reglas:** un título y hasta 15 reglas numeradas. Cada regla tiene su título y, si tiene descripción, se despliega.
  - **Botones:** un título y hasta 10 botones con link (web externa o una página de Asinko).
  - **Lista de comunidades:** un título y hasta 10 grupos o activos, con su avatar, sus miembros y **Unirse**.
  - **Imágenes:** un título opcional y hasta 10 imágenes con su descripción y, si tienen, un link. Se ven de a una y se pasan de costado.
  - **Calendario:** un título y hasta 20 eventos con nombre, fecha y hora (o "todo el día"), fin opcional, lugar opcional y link opcional. Muestra los próximos 5, del más cercano al más lejano, en la zona horaria de quien mira. Sin eventos futuros, "Sin eventos próximos".
- [ ] **CW-07** Un link de usuario solo se acepta si es `http(s)` o una página de Asinko. Se abre con `rel="noopener noreferrer nofollow ugc"` y muestra su dominio real cuando es externo (`security.md § 1`).

### Editar widgets (solo moderadores)

- [ ] **CW-08** Un moderador ve **Editar widgets** arriba de la columna derecha (y en el desplegable del teléfono). Abre una ventana con la lista: Detalles de la comunidad (fijo, se edita desde "Editar comunidad" más adelante) y cada widget con su tipo, su título y **›** para editarlo. Abajo, "Widgets: N/20", **Añadir widget ▾** (los 6 tipos, cada uno con su descripción), **Cancelar** y **Guardar**. En el teléfono, a pantalla completa.
- [ ] **CW-09** (Q4) Los widgets se ordenan **arrastrando** del asa (mouse o dedo) y con **Subir** y **Bajar** en cada uno, que también sirven con teclado y lector de pantalla (WCAG 2.5.7). Cada movimiento se anuncia ("Texto, posición 2 de 4").
- [ ] **CW-10** **›** abre el formulario del widget dentro de la misma ventana, con **Volver**. Cada tipo tiene sus campos, sus límites con contador y sus errores. Hay **Eliminar widget**, con confirmación. Un widget nuevo se agrega al final y abre su formulario.
- [ ] **CW-11** Las **Imágenes** se eligen del dispositivo (JPEG, PNG, WebP; nunca SVG; hasta 5 MB), se preparan como las de los posts y se suben al guardar el widget. Mientras suben, Guardar espera.
- [ ] **CW-12** **Guardar** manda la lista entera y cierra. La página muestra el cambio al instante. **Cancelar**, Esc o × con cambios piden confirmación. Si el servidor rechaza algo, se dice en qué widget y nada de lo escrito se pierde.
- [ ] **CW-13** Quien no es moderador no ve "Editar widgets". La action verifica la sesión y el backend decide si es moderador (`403`).

### Calidad

- [ ] **CW-14** Mobile first a 360 px; axe sin violaciones en claro y oscuro; textos en en, es y pt; la ventana se carga al primer uso y la primera carga del grupo, el detalle y el activo quedan dentro de 240 KB de JS.
- [ ] **CW-15** `proposals.md` con P-028 y P-029, y los mocks con su forma y sus errores. El usuario demo modera `#trading-on-chain`, que trae widgets de ejemplo de cada tipo.

## Fuera de alcance

- Editar los detalles de la comunidad (nombre, descripción, banner, avatar): "Editar comunidad", otro spec.
- La etiqueta de publicación como widget, el modo moderación de los posts (aprobar, quitar), "Desarrolla tu comunidad" y la guía de moderación.
- Fijar posts en la comunidad ("Lo más destacado de la comunidad").
- El banner ancho en las páginas de activo y de perfil.
