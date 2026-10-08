# Posts con imagen — Requirements

> **Estado:** borrador para el PO (2026-10-08). Preguntas abiertas al final.
> **Fuente:** documento de entregables (`docs/references/ASINKO-requirements.pdf`, "Crear post": `type` TEXT, LINK o **IMAGE**, `imageUrl` si `type = IMAGE`), elegido por el PO el 2026-10-08 (punto A), con X e Instagram de inspiración.
> **Desbloqueo:** el backend decidió el 01/10/2026 que **la app sube directo** al bucket `post-images` de Supabase Storage con la sesión del usuario y manda la URL a `POST /posts`, que rechaza (422) cualquier `imageUrl` de otro origen (`asinko-app`, `INFRA-PENDIENTES.md § Storage`). Esto responde P-013.

## Objetivo

Publicar un post con una imagen, con la comodidad de X: elegirla, pegarla o arrastrarla, verla antes de publicar y sacarla con un toque.

## User stories

- Como usuario, quiero publicar una captura de un gráfico con mi análisis.
- Como usuario, quiero pegar una imagen que acabo de copiar sin guardarla primero.
- Como usuario, no quiero que la foto publique dónde la saqué (metadatos de ubicación).

## Criterios de aceptación

### Elegir la imagen

- [ ] **PI-01** La pestaña **Imagen** del editor deja de ser "Próximamente". En ella hay una zona "Arrastrá una imagen o elegila" con un botón **Elegir imagen** que abre el selector de archivos (en el teléfono, también la cámara y la galería).
- [ ] **PI-02** En desktop, **arrastrar** una imagen sobre el editor o **pegarla** (Ctrl/Cmd + V) en el título o el cuerpo la adjunta y pasa a la pestaña Imagen, como X.
- [ ] **PI-03** Se aceptan **JPEG, PNG y WebP** (los tipos del bucket). Otro tipo (GIF, SVG, PDF…) dice "Solo imágenes JPEG, PNG o WebP" y no se adjunta.
- [ ] **PI-04** Una imagen por post (el contrato tiene un solo `imageUrl`).

### Preparar y subir

- [ ] **PI-05** Antes de subirla, la imagen se **achica** en el navegador a 2048 px en el lado más largo y se guarda como WebP. Así pesa poco (menos de 4 MB, por el límite de Vercel en los requests) y **pierde los metadatos** (EXIF con la ubicación, `security.md § 6`). La orientación de la foto se respeta.
- [ ] **PI-06** Se sube **al adjuntarla**, no al publicar, como X: mientras sube, la vista previa muestra "Subiendo…" y **Publicar** espera. Si falla, dice "No se pudo subir la imagen" con **Reintentar**.
- [ ] **PI-07** La imagen va a la carpeta del usuario en `post-images` (`{userId}/{uuid}.webp`), subida desde el servidor de la app con la sesión del usuario: el navegador nunca ve el token (`security.md § 3`).

### Vista previa

- [ ] **PI-08** La vista previa ocupa el ancho del editor con la proporción de la imagen (máximo 16:9 de alto, como en el feed), con un botón **✕ Quitar imagen** arriba a la derecha y **Cambiar**.
- [ ] **PI-09** El título y el cuerpo siguen siendo obligatorios, como en Texto (el backend los exige también en Imagen).

### Publicar y ver

- [ ] **PI-10** Publicar manda `type: IMAGE` con el `imageUrl` subido y lleva al detalle, como hoy. La imagen se ve en el feed y en el detalle con el componente que ya existe.
- [ ] **PI-11** Sin sesión, la pestaña Imagen abre el aviso de cuenta, como el resto del editor.

### Calidad

- [ ] **PI-12** A 360 px el editor y la vista previa entran sin scroll horizontal; el botón ✕ mide 44 px.
- [ ] **PI-13** Teclado y lectores: la zona de arrastre es un botón con nombre, "Subiendo…" y los errores se anuncian, ✕ tiene nombre ("Quitar imagen").
- [ ] **PI-14** Textos en en, es y pt; axe sin violaciones en claro y oscuro.
- [ ] **PI-15** El código de la imagen se carga con el editor (que ya es diferido): la primera carga de las páginas no crece (`seo.md`).

## Fuera de alcance

- Varias imágenes, GIFs, video, recortar o filtros.
- Texto alternativo escrito por el usuario (el contrato no tiene el campo; ver Q2).
- Editar la imagen de un post publicado (editar posts está fuera de esta etapa).

## Dependencias

- **Bucket `post-images` creado en el Supabase de `dev`**, público, 5 MB, JPEG/PNG/WebP y las políticas de carpeta propia (`INFRA-PENDIENTES.md`). No pude verificar desde acá si ya existe: **se le pregunta al backend** (Q3).
- Con `API_MOCKS=true` (CI), la subida se mockea: devuelve una imagen de los fixtures.

## Preguntas abiertas

- **Q1. Imágenes que quedan sin usar:** si alguien sube una imagen y después la quita o descarta el post, el archivo queda en el bucket. ¿La borramos desde la app al quitarla o descartar (**recomendado**, la política "borrar lo propio" ya lo permite)? Alternativa: que el backend limpie los huérfanos.
- **Q2. Texto alternativo:** X deja escribir una descripción de la imagen para lectores de pantalla. ¿Lo proponemos al backend como `imageAlt` (P-013) para una próxima versión (**recomendado**)? Mientras tanto la imagen usa "Imagen del post", como hoy.
- **Q3. Bucket en `dev`:** ¿se lo confirmamos a tu compañero en `proposals.md` (**recomendado**)? Sin el bucket, con el backend real la subida falla con "No se pudo subir la imagen".
