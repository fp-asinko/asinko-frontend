# Mocks

Endpoints answered locally when `API_MOCKS=true` (never in production). See `docs/ai-guidelines/api-integration.md § Mocks`.

| Method | Path                           | Kind     | Why                                                     |
| ------ | ------------------------------ | -------- | ------------------------------------------------------- |
| GET    | `/api/v1/profiles/:identifier` | contract | Example that proves the mechanism (E01 is implemented). |

- **contract**: in `docs/references/api/` but not implemented in the backend yet.
- **proposal**: the frontend needs it and it is not in the contract; described in `docs/references/api/proposals.md`.

Adding a mock: register it in `handlers.ts` with its response `schema`, add fixtures under `fixtures/`, and a row here. `fixtures.test.ts` validates every handler against its schema. Remove the mock when the backend ships the endpoint.
