# El grupo como protagonista y botón Unirse — Tasks

- [x] **T-01 (S)** Contrato:
  - `communitySummarySchema` con `avatarUrl` y `viewerMembership` opcionales, y `joinResponseSchema`.
  - Mock `PUT …/members/:userId` y feed mock con los campos de P-010.
  - P-010 en `proposals.md`.
  - Tests: `fixtures.test.ts`. → CF-11
- [x] **T-02 (M)** Datos del feed:
  - `CardCommunity` y el mapper con fallback.
  - `getFeed` con `signedIn` y las dos listas en paralelo.
  - Los que llaman a `getFeed` pasan la sesión.
  - Tests: mappers y feed-api. → CF-04, CF-12
- [x] **T-03 (S)** `joinCommunity` en `lib/communities/` y sus tests. → CF-07, CF-08
- [x] **T-04 (M)** `JoinedProvider` y `JoinButton` (cva `card`/`compact`, optimista, aviso en línea, foco), montados en el layout, con sus tests. → CF-05 a CF-09, CF-14
- [x] **T-05 (M)** `CardByline` en dos líneas, más el canal personal y el botón en las tarjetas de post y encuesta, con sus tests. → CF-01 a CF-05, CF-13
- [x] **T-06 (S)** Suggested con `JoinButton compact`; borrar las claves viejas. Tests. → CF-10, CF-16
- [x] **T-07 (M)** E2E `community-join.spec.ts` (mobile + desktop, axe), presupuesto de JS y ajustes de los e2e que miran la cabecera. Actualizar `design-system.md`. → CF-13, CF-15

Orden: T-01 → T-02 y T-03 → T-04 → T-05 y T-06 → T-07.
