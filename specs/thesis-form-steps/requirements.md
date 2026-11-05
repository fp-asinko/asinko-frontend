# El formulario de tesis en pasos, con buscador y carrusel — Requirements

> **Estado:** aprobado por el PO el 2026-11-04 ("si"), con Q1 a Q4 como se recomendaron.
> **Fuente:** pedido del PO (2026-11-04), sobre una captura del formulario de tesis:
>
> - el selector de activo pasa a ser un buscador, a la mitad del ancho;
> - al lado, un carrusel con los activos que tienen más tesis (BTC, NVIDIA…);
> - cada parte con un título de paso.
>
> **Cambia** `specs/thesis-create` TC-02 y TC-29 (el activo como selector-tarjeta a todo el ancho). El resto del formulario queda igual.
> **Backend:** no hay un ranking de activos por cantidad de tesis. Lo más parecido, `GET /users/{id}/active-communities` (P-027), es por persona y cuenta posts y encuestas también. Se propone uno nuevo (P-040) y se mockea mientras tanto (Q1).

## Objetivo

Que elegir el activo sea escribir su nombre, como en cualquier buscador, y que los activos de los que más se está hablando estén a un toque. Y que el formulario se lea como una secuencia de pasos.

## User stories

- Como usuario, quiero escribir "nvi" y elegir NVIDIA, sin abrir una lista primero.
- Como usuario, quiero ver de qué activos se están publicando más tesis, y elegir uno con un toque.
- Como usuario, quiero saber en qué paso estoy y cuántos faltan.

## Criterios de aceptación

### El buscador de activos

- [ ] **FS-01** El activo se elige con un **buscador**: un campo de texto, "Buscá un activo…". Al escribir, aparece debajo la lista del catálogo que coincide (símbolo o nombre, con su logo y su precio). Se elige con flechas y Enter, o con un clic (Q4). Es un combobox accesible: el campo anuncia la lista, la opción activa y cuántos resultados hay.
- [ ] **FS-02** Elegido, el campo pasa a mostrar el activo: su logo, símbolo, nombre, precio y la variación del día (TC-29), con una **×** para cambiarlo. Al tocar la × vuelve el campo vacío con el foco. Sin resultados: "No hay activos con ese nombre".
- [ ] **FS-03** Lo demás de elegir un activo sigue igual (`specs/thesis-create`):
  - viene elegido desde la URL (TC-02);
  - define dónde se publica (TC-03);
  - da el ejemplo del claim y del objetivo (TC-22, TC-24).

### El carrusel

- [ ] **FS-04** Desde `sm`, el buscador ocupa **la mitad del ancho**; en la otra mitad, un **carrusel** con los activos que más tesis tienen en los últimos 30 días (Q1). Cada uno muestra su logo, el símbolo y "12 tesis". Va de más a menos, hasta 10. En el teléfono va debajo del buscador, a todo el ancho.
- [ ] **FS-05** **Se mueve solo, como una cinta de bolsa** (PO, 2026-11-04; antes: scroll a mano, sin autoplay): desliza lento y constante, en bucle. Se detiene con su botón de pausa (WCAG 2.2.2), con el mouse encima y mientras el dedo está apoyado; con el foco del teclado adentro vuelve al inicio y queda quieta. Con "reducir movimiento" queda quieta, con scroll a mano y sin el botón. Sin sombras. Cada activo es un botón con su nombre accesible ("Bitcoin, 12 tesis"), una sola vez para el lector de pantalla.
- [ ] **FS-06** Tocar un activo **lo elige** (Q2): queda en el buscador como si lo hubieras buscado, con todo lo de FS-03. El elegido se marca en el carrusel.
- [ ] **FS-07** Si el ranking falla o viene vacío, el carrusel no aparece y el buscador ocupa todo el ancho. El formulario sigue funcionando.

### Los pasos

- [ ] **FS-08** Cada parte lleva un **título de paso numerado** (Q3): ① Activo, ② Predicción, ③ Fecha límite, ④ Precio objetivo, ⑤ Convicción, ⑥ Razonamiento. El número va en un círculo, y el nombre es el label del campo, como hoy. "Se publica en" queda sin número, con los botones.
- [ ] **FS-09** Un paso completo se marca: el círculo pasa a ✓, sin depender solo del color. Los lectores de pantalla oyen "Paso 1 de 6".

### Calidad

- [ ] **FS-10** A 360 px nada genera scroll horizontal fuera del carrusel. Axe sin violaciones en claro y oscuro con la lista del buscador abierta. Todo con teclado.
- [ ] **FS-11** Presupuesto de JS (`seo.md`): `/submit?type=thesis` no puede pasar los 240 KB. El carrusel no suma librerías: scroll nativo con `scroll-snap`.
- [ ] **FS-12** En 1280×800 "Publicar" sigue entrando sin scroll (TC-36).
- [ ] **FS-13** Mocks: el ranking con la forma de P-040, validado en `fixtures.test.ts`. Textos en en, es y pt.

## Fuera de alcance

- Tesis destacadas o "las tesis más votadas" en el formulario: el carrusel es de activos.
- Elegir el período del ranking (siempre 30 días).
- Cambiar el selector de comunidad de "Se publica en" o el de los posts.

## Preguntas resueltas (2026-11-04, todas como se recomendaron)

- **Q1. De dónde sale el carrusel:** se propone a Eugenio un endpoint con los activos que más tesis tienen (P-040) y se mockea mientras tanto.
- **Q2. Tocar un activo del carrusel:** lo elige en el buscador.
- **Q3. Los títulos:** pasos numerados en un círculo (① Activo…), en lugar de "Primero, Segundo…".
- **Q4. El buscador:** un campo donde se escribe y aparece la lista debajo; elegido, muestra el activo con una × para cambiarlo.
