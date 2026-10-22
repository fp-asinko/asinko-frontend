# La columna derecha del perfil, como Reddit — Requirements

> **Estado:** aprobado por el PO el 2026-10-19: "vayamos con 1 2 y 3" (tarjeta de reputación, compartir el perfil y "Participa en"). Q1: bajo el nombre quedan **seguidores y seguidos**; el resto de los números pasa a la tarjeta. Q2: "Participa en" son las **5 comunidades o activos donde más publicó en los últimos 90 días**.
> **Fuente:** pedido del PO (2026-10-19), con una captura de la columna derecha de un perfil de Reddit (Compartir, seguidores, Karma, Contribuciones, Edad de Reddit, "Participa en", logros) y del perfil de hoy, que usa la columna genérica (Season Tokens, Vistos recientemente).
> **Backend:** el `Profile` ya trae precisión, racha, acertadas, erradas, puntos y fecha de alta. No hay dónde publica cada persona: se propone (P-027) y se mockea.
> **Después:** los logros (la "vitrina de trofeos" de Reddit), en otro spec.

## Objetivo

Que al entrar a un perfil se vea de un vistazo cuánto acierta la persona y de qué habla, como la tarjeta de Reddit, y que se pueda compartir.

## User stories

- Como visitante, quiero ver la precisión, la racha y cuánto tiempo lleva alguien en Asinko junto a su perfil, para decidir si le creo.
- Como visitante, quiero ver en qué comunidades y activos publica, para saber de qué habla.
- Como usuario, quiero compartir mi perfil (o el de otra persona) con un toque.

## Criterios de aceptación

### La tarjeta (desde desktop, en la columna derecha)

- [x] **PA-01** _Cambio del PO (2026-10-21): sin la foto ni el nombre, que la cabecera ya muestra, y con fondo gris (`--surface`) como las demás tarjetas de la columna, como Reddit; los logros van dentro de la misma tarjeta, después de "Participa en"._ En un perfil, la columna derecha empieza con una tarjeta: la foto chica y el nombre (o el `@usuario`); debajo, en una grilla de dos columnas, **Precisión**, **Racha**, **Acertadas**, **Erradas**, **Puntos** y **Miembro desde** (mes y año). Sin tesis resueltas, la precisión dice "—" con "Sin tesis resueltas". Después, **Participa en** (PA-05) y, como hoy, "Vistos recientemente" y el pie. Season Tokens no va en el perfil.
- [x] **PA-02** (Q1) Bajo el nombre quedan solo **seguidores** y **seguidos** (siguen abriendo sus listas). La racha y la precisión pasan a la tarjeta.

### En el teléfono y la tablet

- [x] **PA-03** Sin columna derecha (por debajo de `lg`), la misma tarjeta va en la página, entre la presentación ("Abierto a" incluido) y "Completa tu perfil". Así el contenido es el mismo en mobile y desktop (`seo.md`).

### Compartir

- [x] **PA-04** **Compartir perfil**, un botón redondo junto a las acciones de la cabecera ("Crear post", "Editar perfil" o "Seguir"), en todos los tamaños: abre el menú del sistema en el teléfono; en desktop copia el link del perfil y lo dice ("Link copiado"), como compartir un comentario. _Cambio al implementar (2026-10-19): en la tarjeta de la columna derecha, `ShareButton` viajaba dos veces (Turbopack arma la columna como una entrada aparte) y el perfil quedaba a 0,3 KB del límite; en la cabecera reusa el que ya viaja._

### Participa en (Q2)

- [x] **PA-05** **Participa en**: las 5 comunidades o activos donde la persona más publicó en los últimos 90 días, de más a menos, cada uno con su avatar, su nombre de mención (`$GGAL`, `#macro`) y cuántos posts ("12 posts"), con link a su página. Si hay más, **Ver todas (N)** las despliega (hasta 20) sin JavaScript. Sin posts en 90 días, la sección no aparece.

### Calidad

- [x] **PA-06** Mobile first a 360 px; axe sin violaciones en claro y oscuro; textos en en, es y pt; la primera carga del perfil dentro de 240 KB de JS (todo lo nuevo es de servidor).
- [x] **PA-07** `proposals.md` con P-027 y el mock con su forma y sus errores.

## Fuera de alcance

- Logros y trofeos (otro spec), oro y karma (economía, fase 4).
- Los atajos de "Ajustes" de Reddit: "Editar perfil" ya está bajo el banner.
- Una página con todas las comunidades donde publica.
