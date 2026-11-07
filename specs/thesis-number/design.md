# El número de la tesis — Design

> Estado: **aprobado** (PO, 2026-11-06).

## Datos

- **P-047** (propuesta): `authorSequence: number` (entero, desde 1) en el recurso `Thesis`. Es el orden de la tesis entre las publicadas por su autor, canceladas incluidas: no cambia nunca.
- Contrato: `authorSequence: z.number().int().positive().optional()` en `thesisSchema`. Sin el campo, no se muestra (TN-05).
- Dominio: `ThesisTicketData.number: number | null`, que toma `toThesisTicket`. Es `null` en una tesis del sistema.
- **Mock:** `withIdentity` (`src/mocks/thesis-identity.ts`) lo suma. En los fixtures, es el orden por `publishedAt` entre las del mismo autor. En una tesis real (`missing`), sale de un hash del id, entre 1 y 40.

## UI

- `ThesisSerial` (en `thesis-stamp.tsx`): `#12` en `text-5xl font-black leading-none tracking-tight tabular-nums`, `text-foreground/[0.07]`: decorativo, como impreso en el papel.
- Va `absolute top-2 right-4` en el talón de abajo (arriba: cerrada, el sello lo pisa solo en parte y el número se sigue leyendo), por detrás del `dl` (`relative`) y del sello del estado. `pointer-events-none` y `select-none`.
- **Accesible:** la serie es `aria-hidden`. Al lado va un `sr-only` con `thesisTicket.number` ("Thesis number {n} by {author}"). El autor llega por prop (`author`), porque el ticket no lo conoce.

## Textos

`thesisTicket.number`: "Thesis number {number}{hasAuthor, select, yes { by {author}} other {}}". En en, es y pt.
