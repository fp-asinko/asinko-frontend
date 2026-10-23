# La caja de publicar en una fila — Design

`ComposerPlaceholder` (`features/feed/components/composer-placeholder.tsx`), solo clases, mobile first:

- El contenedor pasa a `sm:flex sm:items-center sm:gap-3`.
- La fila del avatar y el texto suma `sm:min-w-0 sm:flex-1`: es la que cede ancho, y el texto se corta con el `truncate` que ya tiene (CR-04).
- La fila de los íconos suma `sm:mt-0 sm:shrink-0 sm:border-t-0 sm:pt-0` (CR-01). Publicar pasa de `ml-auto` a `ml-auto sm:ml-1.5`, así queda junto a los íconos a la derecha.
- Debajo de `sm` no cambia nada (CR-02). El DOM tampoco cambia, así que el orden del teclado es el de hoy (CR-03).

Sin JavaScript nuevo: no toca el presupuesto.
