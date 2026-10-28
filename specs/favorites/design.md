# Favoritos en grupos, personas y activos — Design

## 1. Sin propuesta al backend

Todo sale de lo que ya existe (ver `requirements.md § Fuente`):

- **Marcar:** `PUT` o `DELETE /communities/{slug}/favorite`, con la acción `setFavorite` de `@/lib/communities`, la misma de la cabecera.
- **Leer:** `viewerIsFavorite` de `GET /communities?mine=true`.
- **Personas:** el slug de su canal personal y su `createdByProfileId`.

Antes de subirlo conviene avisarle al backend que se favoritean canales personales: funciona, pero es un efecto de cómo está modelado y no algo del contrato.

## 2. Dominio (`features/interests`)

- `Group`, `Person` y `AssetTile` suman `favorite: boolean`. `Person` suma `channelSlug`, el slug de su canal; si no está entre tus membresías, el username.
- `followedChannels(mine)` arma un mapa de `createdByProfileId` → `{ slug, favorite }` con los canales personales de los que sos miembro.
- `favoritesFirst` es un orden estable: las favoritas primero y el resto como vino.
  - **Grupos:** favoritos, después los que moderás.
  - **Personas y activos:** favoritos primero.

## 3. UI

- **`FavoriteStar`** (cliente, `features/interests/components/favorite-star.tsx`):
  - un botón `size-7` al lado del link de la fila; la fila es `group/row`;
  - favorito: estrella llena, negra, siempre visible;
  - si no: vacía, con `opacity-0` hasta el hover o el foco de la fila;
  - es optimista: refresca la página para reordenar y, si falla, vuelve atrás y lo anuncia (`role="alert"`).
- **Grupos y Personas:** la estrella a la derecha de la fila. En Personas va después de la precisión.
- **Activos** (PO, 2026-10-28): `FavoriteStar` con `placement="corner"`, en la esquina de la tarjeta. Es chica (12 px, en 24 px para tocarla) y sin fondo. La tarjeta de la página actual va con `bg-muted`, ya no con borde negro. Se probó primero una estrella junto al símbolo, sin botón: no gustó.
- **Cabecera de un perfil seguido:** `CommunityActions` muestra la estrella también con `variant="user"` (FV-03).

## 4. Mocks

- `GET /communities?mine=true` suma los canales personales que el usuario demo sigue, con las favoritas primero, como el backend.
- `maria` y `$BTC` están marcados como favoritos para verlo en desarrollo.
- El mock de `favorite` no guarda nada: al recargar, se vuelve a ver lo de los fixtures (como los votos).

## 5. Peso

`FavoriteStar` es un componente cliente chico dentro de la columna, que está en el layout y por eso viaja en todas las rutas. Lo controla `performance.spec.ts`.
