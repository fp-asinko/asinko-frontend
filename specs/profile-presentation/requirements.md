# Presentación del perfil — Requirements

> **Estado:** aprobado por el PO el 2026-10-16: nombre y titular, links externos, ubicación, foto y banner; todo en la ventana "Editar perfil"; hasta 5 links con ícono. Q1: titular de 100. Q2: país de una lista y ciudad libre. Q3: **con recorte**. Q4: los íconos propuestos.
> **Fuente:** pedido del PO (2026-10-16), con capturas de un perfil de LinkedIn y de su ventana "Editar presentación": "hay que tomar lo bueno de LinkedIn para los perfiles de usuario, también el poder editar el perfil y poder agregar links externos".
> **Hoy** (`specs/community-pages` § 12, `specs/profile-edit`): el perfil muestra banner (el degradé de su color), avatar, el nombre visible o el `@usuario`, la bio, seguidores y seguidos. "Editar perfil" solo cambia la bio.
> **Backend** (E01, respuesta del 2026-10-13): `PATCH /users/{userId}` acepta `bio`, `displayName` (≤50), `avatarUrl`, `countryCode`, `language`. **No tiene** titular, ciudad, links, banner del usuario ni dónde subir una foto: se proponen (P-019 a P-021) y se mockean.

## Objetivo

Que el perfil cuente quién es la persona de un vistazo, como LinkedIn: nombre, a qué se dedica, de dónde es y dónde más publica; y que lo pueda editar en un solo lugar.

## User stories

- Como usuario, quiero un titular bajo mi nombre ("Analista macro | Renta fija | LatAm") para que se entienda qué analizo antes de leer mis posts.
- Como usuario, quiero sumar mis links (mi Substack, mi X, mi canal) para que me sigan también afuera.
- Como usuario, quiero mi foto y un banner propios, no el degradé.
- Como visitante, quiero ver de dónde es alguien y a qué se dedica para darle contexto a su track record.

## Criterios de aceptación

### El perfil

- [x] **PP-01** Debajo del nombre y de los botones, a todo el ancho (el visible, o el `@usuario` si no tiene), en este orden: el **titular**; la **ubicación** en gris ("La Plata, Argentina", o solo el país); los **links** (PP-03); y después la bio, seguidores y seguidos, como hoy. Lo que no está cargado no ocupa lugar.
- [x] **PP-02** El banner y la foto son los que subió la persona; sin ellos, el degradé y las iniciales de hoy.
- [x] **PP-03** (Q-links) Hasta **5 links**, en una fila que pasa a la línea de abajo: el **ícono** del sitio (X, LinkedIn, YouTube, Instagram, GitHub, Substack, TradingView; un globo para el resto) y el **dominio real** (`substack.com`), para que no se pueda disfrazar a dónde lleva. Abren en otra pestaña con `rel="noopener noreferrer nofollow ugc"` (`security.md § 1`).
- [x] **PP-04** En tu perfil, lo que falta se ofrece donde iría, en gris: "Agrega un titular", "Agrega links" (abren la ventana en esa sección). En el de otra persona no aparece nada.

### La ventana "Editar perfil" (como "Editar presentación" de LinkedIn)

- [x] **PP-05** Una sola ventana con secciones, en este orden: **Foto y banner**, **Nombre** (≤50), **Titular** (Q1, ≤100), **Ubicación** (país de una lista y ciudad, Q2), **Bio** (≤160, como hoy) y **Links** (hasta 5). Contadores cerca del límite, como el título de un post. En el teléfono, a pantalla completa. Guardar queda siempre a mano, fijo arriba con el título (como la ventana de hoy); el cuerpo scrollea.
- [x] **PP-06** **Links:** cada uno es una URL (`https://…`, solo `http(s)`); se suma con "Agregar link", se quita con su ×, y el ícono aparece al escribirla. Una URL inválida dice qué falta y no deja guardar.
- [x] **PP-07** _(Cambió con `specs/profile-edit-flow`, 2026-10-22: una cámara sobre cada imagen, y se guardan al aplicar o quitar, sin Save.)_ **Foto y banner:** "Cambiar foto" y "Cambiar banner" eligen una imagen (JPEG, PNG, WebP; nunca SVG; hasta 5 MB) y la ventana pasa a un **recorte** (Q3): la imagen se arrastra y se acerca (con el dedo, el mouse, la rueda, las flechas o un control deslizante) dentro de un marco **redondo** (foto, 1:1) o **de 4:1** (banner). "Aplicar" corta esa parte, la prepara como las de los posts (`specs/post-image`: WebP, tamaño máximo) y la muestra en la ventana; "Volver" la descarta. "Quitar" vuelve al degradé o a las iniciales.
- [x] **PP-08** **Guardar** manda solo lo que cambió y cierra; el perfil lo muestra al instante. Mientras sube una imagen o guarda, Guardar espera y dice qué está haciendo. Cancelar o Esc con cambios piden confirmación (como hoy).
- [x] **PP-09** Si algo falla, el error dice qué campo y lo escrito no se pierde. El `userId` sale de la sesión (`api-integration.md`).

### Calidad

- [x] **PP-10** Mobile first a 360 px; axe sin violaciones en claro y oscuro; la ventana se carga al primer uso y la primera carga del perfil no pasa el presupuesto de JS (`seo.md`: quedan ~1,6 KB en el perfil).
- [x] **PP-11** Textos en en, es y pt; el titular, la ciudad y los links se muestran como texto plano (sin Markdown).
- [x] **PP-12** Mocks con la forma de P-019 a P-021, con sus errores (`422` por largo, URL inválida o más de 5 links).

## Fuera de alcance

- Experiencia, educación, "En busca de empleo", servicios, sugerencias y "Análisis" (visitas al perfil) de LinkedIn: no son de una red de finanzas, o necesitan datos que no hay.
- Cambiar el `@usuario`, perfil privado.

## Preguntas resueltas (2026-10-16)

- **Q1. ¿Largo del titular?** LinkedIn deja 220. Recomiendo **100**: entra en una línea en desktop y en dos en el teléfono, y obliga a ir al grano.
- **Q2. ¿Ciudad libre o de una lista?** Recomiendo **texto libre** (≤60) más el **país de una lista** (el `countryCode` que el backend ya tiene, con los nombres traducidos por el navegador): una lista de ciudades necesita un servicio de lugares.
- **Q3. ¿Recortar la foto y el banner?** Recomendé no por ahora; el PO lo quiere **en este spec** (PP-07).
- **Q4. ¿Íconos de qué sitios?** Propongo X, LinkedIn, YouTube, Instagram, GitHub, Substack y TradingView, dibujados como los de compartir (`share-marks.tsx`, sin librería nueva); el resto con un globo.
