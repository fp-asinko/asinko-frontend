# Visto recientemente — Design

## 1. Piezas

| Pieza                | Dónde                                                   | Qué hace                                                                                                                                      |
| -------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `recently-viewed.ts` | `lib/`                                                  | Leer, registrar y borrar la lista en `localStorage` (con `try/catch`), validarla a mano (sin zod: corre en el navegador) y avisar los cambios |
| `RecordView`         | `features/feed/components` (cliente)                    | En el detalle de un post: registra la visita al montarse. No dibuja nada                                                                      |
| `RecentlyViewed`     | `components/organisms/right-column` (cliente, diferido) | El bloque de la columna: título, "Borrar", ítems o vacío                                                                                      |
| `RecentlyViewedSlot` | `components/organisms/right-column` (cliente, mínimo)   | Descarga `RecentlyViewed` solo desde 1024 px y cuando el navegador queda libre                                                                |

El organismo no conoce el negocio: recibe ítems genéricos (`href`, `label`, `title`, `score`, `comments`, `kind`, `viewedAt`). Quien sabe qué es un post es el feature (`RecordView`).

## 2. Datos

```ts
type RecentItem = {
  id: string
  href: string // la ruta del post, sin idioma: /post/{id}/{slug}
  label: string // $BTC, #macro o @autor (canal personal)
  title: string
  kind: 'post' // 'poll' | 'thesis' | 'alert' más adelante
  score: number
  comments: number
  viewedAt: string // ISO
}
```

- Clave `asinko:recently-viewed`, hasta 10, el más reciente primero, sin repetidos por `id`.
- Lo leído se valida campo por campo; un ítem raro se descarta (es dato del navegador, no confiable). `href` solo si empieza con `/post/` (nunca una URL de afuera).
- Cambios en la misma pestaña: un evento `asinko:recently-viewed`. En otra pestaña: el evento `storage`. `RecentlyViewed` los escucha con `useSyncExternalStore`.

## 3. Cómo se ve (el prototipo)

- Bloque sin fondo, con borde abajo entre ítems: cabecera "VISTO RECIENTEMENTE" (`type-section`, gris) y "Borrar" a la derecha (`type-action`, link).
- Ítem (link a todo el ancho, `hover:bg-surface`, foco visible): primera línea, la comunidad (`type-meta`, negrita, gris oscuro) y el tiempo relativo a la derecha (`type-meta`, gris); el título en `type-small` semibold, `line-clamp-2`; última línea, ↑ votos y 💬 comentarios (`type-meta`, gris, números compactos) y a la derecha la píldora del tipo ("POST", gris, como las de las tarjetas).
- Nombre accesible del link: "$BTC: título, hace 1 h" (las partes con `{' '}` y `sr-only` donde hace falta). Los números van con su texto para lectores ("892 votos, 156 comentarios").
- Vacío: "Nada visto recientemente", centrado y gris.
- El tiempo con `useFormatter().relativeTime` (corto: "12 min", "1 h").

## 4. Presupuesto

- En la primera carga de todas las páginas: solo `RecentlyViewedSlot` (unas 20 líneas) y su entrada en el manifiesto de chunks diferidos.
- En el detalle de post, además `RecordView` (unas 15 líneas, comparte `lib/recently-viewed.ts`).
- `RecentlyViewed` (lista, formato, eventos) en un chunk diferido que se baja con `requestIdleCallback` y `matchMedia('(min-width: 1024px)')`: en mobile nunca se descarga.
- **Medido al cerrar (2026-10-08):** Home y detalle 237,7 KB (antes 236,8), páginas de comunidad 239,4 KB (antes 238,6), contra 240. Entra; quedan 0,6 KB.

## 5. Tests

- Unitarios: `lib/recently-viewed` (orden, tope, repetidos, validación, `href` externo, storage bloqueado, eventos), `RecordView` (registra, no registra un post borrado), `RecentlyViewed` (ítems, vacío, Borrar, nombre accesible, se actualiza con el evento), `RecentlyViewedSlot` (no carga por debajo de 1024 px).
- E2E (desktop): abrir dos posts y volver al Home: aparecen en orden con su título; Borrar; axe en claro y oscuro. Mobile: la columna no existe. Presupuesto de JS.
