# Contenido que llega con un fade — Design

## Una utilidad, sin caja

`arrive`, en `globals.css`:

```css
@utility arrive {
  display: contents;
  & > * {
    animation: var(--animate-fade-in);
  }
}
```

- **Por qué `display: contents`:** el envoltorio no genera caja, así que el layout no cambia (CR-04): la columna de intereses mide su alto con un contenedor de tamaño, y un `div` común lo rompería. La animación va en sus hijos directos, que sí tienen caja.
- **Cuándo se dispara:** una animación CSS corre cuando el elemento entra al DOM. El contenido de un `Suspense` entra cuando reemplaza al skeleton; con una `key` nueva (otro filtro u orden), entra de nuevo y vuelve a hacer el fade.
- **Movimiento:** solo opacidad, 200 ms y `ease-out`, el token que ya existe. Es lo que se ve decenas de veces por día: un cambio casi imperceptible y sin desplazamiento (skills `animate` y `emil-design-eng`).

## Dónde va

- **`Suspense`:** un `<div className="arrive">` adentro de cada uno con skeleton (y de los que no tienen fallback, los anuncios), envolviendo su contenido. El skeleton queda afuera: no se anima al salir.
- **`next/dynamic` con `loading`:** `arriving(Component)` (`components/molecules/arriving.tsx`) en el `then` del import envuelve el componente en el mismo `div`, sin tocar cada lugar donde se usa.

## Tests

- `globals.css`: un test que verifica la utilidad (contents y la animación de los hijos).
- E2E: en el Home, la lista del feed está dentro de un `.arrive`, y con `reducedMotion: 'reduce'` no hay animación.
- `performance.spec.ts` sin cambios en ninguna ruta.
