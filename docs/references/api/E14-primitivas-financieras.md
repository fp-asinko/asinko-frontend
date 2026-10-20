# API — E14 Primitivas financieras

**Spec:** `product/specs/E14-primitivas-financieras.md` · **Schema:** `Asset`, `AssetSentiment`, `PriceAlert` (`plan/schema-v1.prisma`)

---

## Recurso `Asset`

```
{
  "id": "uuid",
  "symbol": "string",       // "AAPL", "BTC"
  "exchange": "string | null", // MIC (ISO 10383, ej. "XNAS", "XNYS"), null para crypto
  "name": "string",
  "assetClass": "EQUITY | CRYPTO | ETF | FOREX | INDEX | COMMODITY | OTHER",
  "price": "number | null",         // último precio conocido
  "priceChangePct": "number | null", // variación del día
  "priceUpdatedAt": "ISO 8601 | null",
  "priceStale": "boolean",          // true si la API de mercado falló y esto es el último precio conocido
  "sentiment": { "bullishPct": "number", "bearishPct": "number", "totalVotes": "number" },
  "viewerSentiment": "BULLISH | BEARISH | null"  // null si no hay sesión o el usuario no declaró postura
}
```

### `GET /api/v1/assets/{symbol}` — Ticker Page mínima
**Público.**
**Query params:** `exchange?` (string, MIC) — desambigua cuando el símbolo existe en más de un mercado; si se omite y el símbolo es único, se devuelve ese match.

**Respuesta `200`:** el `Asset` de arriba, más:
```
"openTheses": Thesis[],   // theses abiertas sobre este activo, forma completa en E11-contenido-finanzas.md
"linkedCommunity": { "id", "slug", "name" } | null  // la comunidad SYSTEM_ASSET de este activo, si existe. Su slug NO es el símbolo (minúscula, sin barra: tsla, brk-b; 2026-10-20): se toma de acá, nunca se deduce
```
**Errores:** `404` · `422 AMBIGUOUS_SYMBOL` — si `exchange` se omite y hay más de un match; devuelve la lista de matches (`id`, `symbol`, `exchange`, `name`).

### `GET /api/v1/assets` — Catálogo / autocomplete
**Público.**
**Query params:** `q?` (string) — matchea `symbol`/`name` · `cursor?` · `assetClass?` (`EQUITY,ETF`…, sin distinguir mayúsculas; una clase desconocida da `422`).

**Respuesta (2026-10-20):** `{ items: Asset[], nextCursor }`. Sin `q`: el catálogo entero, alfabético por símbolo, de a 50 con cursor. Con `q`: el autocomplete (hasta 20), `nextCursor: null`.

---

## Sentiment de activo

### `PUT /api/v1/assets/{symbol}/sentiment` — Declarar sentiment
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión.
Idempotente.

**Query params:** `exchange?` (string, MIC) — mismo criterio que `GET /assets/{symbol}`.
**Request body:** `{ "userId": "uuid", "sentiment": "BULLISH" | "BEARISH" }`
**Respuesta `200`:** `{ "bullishPct": "number", "bearishPct": "number", "totalVotes": "number", "viewerSentiment": "BULLISH" | "BEARISH" }`
**Errores:** `403 USER_MISMATCH` · `422 AMBIGUOUS_SYMBOL` — si el símbolo colisiona entre mercados y no se especifica `exchange`.

### `DELETE /api/v1/assets/{symbol}/sentiment` — Retirar sentiment
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito (query param) — mismo criterio que el `PUT`.
Idempotente.

**Respuesta:** `204 No Content` — sin body.
**Errores:** `403 USER_MISMATCH`

---

## Alertas de precio

### `GET /api/v1/price-alerts` — Alertas del usuario
**Auth:** requerida.
**Usuario:** sin comparación — implícitamente filtra por el propio usuario, no hay parámetro de usuario en esta ruta.
Lista no paginada.

**Respuesta `200`:**
```
{
  "id": "uuid",
  "asset": { "id", "symbol", "name" },
  "targetPrice": "number",
  "direction": "ABOVE | BELOW",
  "status": "ACTIVE | TRIGGERED | CANCELLED",
  "triggeredAt": "ISO 8601 | null",
  "createdAt": "ISO 8601"
}
```

### `POST /api/v1/price-alerts` — Crear alerta
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión — se convierte en `PriceAlert.profileId`.

**Request body:** `{ "userId": "uuid", "assetSymbol": "string", "assetExchange"?: "string", "targetPrice": "number", "direction": "ABOVE" | "BELOW" }` — `assetExchange?` desambigua cuando `assetSymbol` colisiona entre mercados, mismo criterio que `exchange?` en `GET /assets/{symbol}`.
**Respuesta `201`:** misma forma que un ítem de `GET /price-alerts`, con `status: "ACTIVE"`.
**Errores:** `403 USER_MISMATCH` · `429 ALERT_LIMIT_REACHED` — si el usuario ya tiene el máximo de alertas activas · `422 AMBIGUOUS_SYMBOL` — si `assetSymbol` colisiona entre mercados y no se mandó `assetExchange`.

### `DELETE /api/v1/price-alerts/{id}` — Cancelar alerta
**Auth:** requerida.
**Usuario:** debe ser igual a `PriceAlert.profileId` **y** `userId` (query param) debe coincidir con la sesión.
Cancela (no elimina físicamente — pasa a `status: CANCELLED`).

**Respuesta:** `204 No Content` — sin body.
**Errores:** `403 USER_MISMATCH`
