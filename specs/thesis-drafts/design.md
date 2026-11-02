# Borradores de tesis — Design

> **Estado:** aprobado por el PO el 2026-11-02 ("si").

## 1. P-038 (propuesta)

- `Draft.type` suma `THESIS`. Una tesis usa `title` para la predicción y `body` para el razonamiento, y suma:
  ```jsonc
  "thesis": {
    "assetSymbol": "BTC" | null,
    "targetPrice": 150000 | null,
    "targetDirection": "ABOVE" | "BELOW" | null,
    "deadline": "ISO 8601" | null, // el fin del día elegido, como en POST /theses
    "conviction": "LOW" | "MEDIUM" | "HIGH" | "EXTREME" | null
  } | null // null en los demás tipos
  ```
- `POST /drafts` y `PATCH /drafts/{id}` aceptan `thesis` con esa forma; nada es obligatorio (como hoy).
- `POST /theses` acepta `draftId`: publica y borra el borrador en la misma operación; inexistente o ajeno, `404` sin publicar (como `POST /posts`).

## 2. Contrato y dominio

- `draftSchema`: `type` con `THESIS` y `thesis` opcional y nullable.
- `SavedDraft` suma `thesis?: { assetSymbol, targetPrice, direction, deadline, conviction }`; `deadline` vuelve al formulario como el día local (`YYYY-MM-DD`) del instante guardado.
- `saveDraftSchema` acepta `THESIS` con sus campos; algo escrito es la predicción, el razonamiento, el activo o el objetivo.

## 3. Mock

- `src/mocks/thesis-drafts.ts`: los borradores de tesis en memoria, por usuario (`mockCaller`), con ids propios (`mockId(42, n)`).
- Rutas `kind: 'proposal'`, `implemented: false`, antes de las de los borradores: `POST /drafts` y `PATCH /drafts/{id}` con `type: 'THESIS'`, y `DELETE /drafts/{id}` de un id de tesis. `MockRoute.when` recibe también los `params` (hoy solo query y body).
- `GET /users/{userId}/drafts`: con `true`, el mock de siempre suma las tesis; con `missing`, una `MockExtension` las agrega a la respuesta del backend, ordenadas por `updatedAt`. El límite de 20 cuenta los dos.
- `POST /theses` con `draftId` (mock): lo borra. Con `missing` el backend ignora `draftId`; hasta que implemente P-038, el front borra el borrador después de publicar (`DELETE`, que con un id de tesis va al mock). Cuando lo implemente, ese `DELETE` se va.

## 4. UI

- `ThesisEditor`: `useSavedDraft`, "Guardar borrador" (deshabilitado sin nada escrito) y `DraftsButton` al final de los formatos.
- `PostEditor` y `ThesisEditor` reciben `draftRequest` (un borrador para abrir) y avisan con `onOpenOther(draft)` cuando el elegido es del otro editor; `SubmitEditor` cambia de pestaña y se lo pasa.
- La lista (`DraftsDialog`) muestra la marca "Tesis" (`composer.drafts.thesis`) en los de tesis.

## 5. Tests

- Unitarios: el esquema, `drafts-api` (lista y guardado con tesis), el mock (cada ruta, el `when` con params, la extensión), `createThesis` con `draftId`, `ThesisEditor` (guardar, abrir), `SubmitEditor` (abrir de la otra pestaña), `DraftsDialog` (la marca).
- E2E: guardar una tesis, verla en la lista con su marca, abrirla desde un post y publicarla.
