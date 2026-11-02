# Fechas en la zona de quien mira — Design

> **Estado:** aprobado por el PO el 2026-11-02 ("dale").

## 1. La cookie

- `src/lib/time-zone.ts`: `TIME_ZONE_COOKIE = 'asinko-tz'` y `validTimeZone(raw)`. Acepta hasta 64 caracteres de `[A-Za-z0-9_+\-/]` que `Intl.DateTimeFormat` acepte como `timeZone`, y devuelve el nombre canónico. Cualquier otra cosa: `null`.
- No es un dato personal sensible ni sirve para autenticar: se lee en el servidor y en el navegador (sin `HttpOnly`).

## 2. El servidor (LT-02)

- `src/i18n/request.ts`: `timeZone: validTimeZone((await cookies()).get(TIME_ZONE_COOKIE)?.value) ?? 'UTC'`. El sitio ya es dinámico (CSP con nonce), así que leer cookies no cambia nada.
- `NextIntlClientProvider`, dibujado desde el layout de servidor, hereda la zona de la configuración (next-intl 4): los componentes cliente formatean con la misma.

## 3. El navegador (LT-01, LT-03)

- `TimeZoneSync` (`components/organisms/time-zone-sync.tsx`, cliente, sin markup) en el layout. Al montar:
  1. Lee la zona del navegador (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
  2. Si `document.cookie` ya tiene esa zona, no hace nada.
  3. Si no, escribe la cookie y llama a `router.refresh()` (de `@/i18n/navigation`): los Server Components se vuelven a dibujar con la zona nueva, sin recargar la página ni perder estado del cliente.
- Lo que compara es la cookie, no lo que usó el servidor. Una zona que el servidor rechace se escribe una vez y no vuelve a refrescar.

## 4. El calendario (LT-04)

`LocalTime` deja el `useSyncExternalStore` y la etiqueta "(UTC)": formatea con la zona configurada, como el resto. Conserva `suppressHydrationWarning`: Node y el navegador traen ICU distintos y la misma hora puede salir con otro espacio (uno angosto antes de "PM"). Sin él, React vuelve a dibujar todo el `body` al hidratar y se pierde lo que se estaba escribiendo. Lo encontraron los e2e de comentarios, que fallaban en las páginas con el calendario de #macro. Un evento de todo el día sigue en UTC: es una fecha. Se va la clave `communities.widgets.calendar.utcWhen`.

## 5. Tests

- **Unitarios:**
  - `time-zone.test.ts`: zonas válidas, canónicas, demasiado largas, con caracteres raros, desconocidas;
  - `time-zone-sync.test.tsx`: escribe y refresca una vez; no refresca con la cookie al día;
  - `local-time.test.tsx` actualizado.
- **E2E** (`e2e/local-time.spec.ts`), con `timezoneId: 'America/Santiago'`:
  - la primera visita escribe la cookie;
  - un evento del calendario se ve en la hora de Santiago.
- **`performance.spec.ts`**: lo mide en todas las rutas.
