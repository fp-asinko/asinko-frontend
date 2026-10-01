# Asinko — Visión de producto

> Documento vivo. Define **qué es** Asinko. El detalle de cada feature vive en `specs/`.
> Referencia visual: [`docs/references/prototype.html`](../references/prototype.html) (prototipo interactivo, no es código de producción; su nombre de trabajo era *FinanceShowOff*).

## Qué es

Asinko es una red social de finanzas. La inspiración es Reddit: comunidades, posts, comentarios anidados y votos. Lo distinto es que la reputación se gana **acertando**: los usuarios publican tesis de inversión verificables, y su historial de aciertos queda público.

## Estilo

La interfaz sigue el lenguaje visual y de interacción de **iOS** (Apple Human Interface Guidelines), adaptado a la web según la skill `apple-design`: tipografía del sistema, movimiento físico e interrumpible, materiales translúcidos y profundidad con moderación. Se implementa con los tokens de `design-system.md`, no con valores sueltos.

## Para quién

- Inversores minoristas que quieren discutir activos con contexto, no ruido.
- Analistas y creadores que quieren construir un track record público y verificable.

## Menciones

Tres símbolos conectan el contenido con entidades. Funcionan en **todo** el contenido: posts, tesis, comentarios y lives. Se guardan como referencias por ID, no como texto, para que un cambio de nombre no rompa menciones viejas.

| Símbolo | Referencia a | Ejemplo | Autocompleta desde |
|---|---|---|---|
| `$` | Activo (por ahora, solo criptomonedas) | `$BTC`, `$ETH` | Catálogo curado de activos soportados |
| `#` | Comunidad | `#macro`, `#defi` | Comunidades existentes |
| `@` | Usuario | `@federicopiva` | Usuarios |

- Cada activo y cada comunidad tiene su página con todo el contenido que lo menciona.
- Mencionar a un `@usuario` le envía una notificación.
- El catálogo de activos es **cerrado**: solo se puede mencionar lo que Asinko soporta. Así cada ticker significa siempre lo mismo (hay varios tokens distintos llamados igual) y se evita promocionar tokens falsos.
- Las **acciones** se suman al catálogo más adelante (ver roadmap).

## Tipos de contenido

### Creados por usuarios

| Tipo | Descripción |
|---|---|
| **Post** | Contenido libre. Formatos: *Thought* (frase corta), *Text* (título + cuerpo), *Image*, *Poll* y *Portfolio* (activos con pesos que suman 100%). |
| **Tesis** | Predicción falsable sobre un activo, con deadline. Es el contenido central de Asinko (ver abajo). |
| **Live** | Hilo en tiempo real sobre un evento (por ejemplo, una decisión de la Fed o un halving). Estados: en vivo, programado, grabado. |

### Creados por la plataforma

Alertas de mercado (movimientos fuertes de un activo), encuestas oficiales, rankings (creadores por accuracy, activos más discutidos), hitos de usuarios y glosario.

## Tesis

Una tesis tiene:

- **Activo** (`$`) y **claim**: una frase clara y falsable, de 140 caracteres como máximo.
- **Razonamiento**, **deadline**, **target** de precio (opcional) y **convicción** del 1 al 4.
- **Snapshot de precio** al momento de publicar.

| Estado | Significado |
|---|---|
| Abierta | Antes del deadline |
| Acertada / Errada | Resuelta automáticamente al deadline contra el precio de mercado |
| Vencida | Llegó al deadline sin poder resolverse |
| Disputada | Resultado impugnado, en revisión |

La comunidad reacciona con **Bullish**, **Bearish**, **Interesting** o **Degen**.

Una tesis publicada **no se puede editar ni borrar**: el track record tiene que ser honesto.

## Reputación

- **Accuracy**: porcentaje de tesis acertadas sobre las resueltas.
- **Racha**: tesis acertadas consecutivas.
- **Rating** estilo calificadora (AAA … D), calculado sobre el historial. **Nunca se compra.** Puede ser *acreditado* si el usuario verifica una credencial o importa un track record externo.
- **Tiers**: *Creator* y *Partner*, para usuarios públicos con historial.

## Comunidades

Una comunidad es un **grupo**: se menciona con `#` y tiene miembros, reglas, moderadores y posts publicados dentro de ella, igual que un subreddit. Los temas que no son activos (IA, opciones, DeFi) también son comunidades.

## Seguir

Un usuario puede seguir tres cosas. Lo que sigue alimenta su feed "Siguiendo":

| Qué | Mención | Qué suma al feed |
|---|---|---|
| Comunidad | `#defi` | Los posts publicados en la comunidad |
| Activo | `$BTC` | Todo el contenido que menciona el activo |
| Usuario | `@quantsimula` | Todo lo que publica el usuario |

Solo las comunidades son grupos. La página de un activo y el perfil de un usuario se siguen, pero no tienen miembros ni moderación.

## Roadmap por fases

| Fase | Alcance |
|---|---|
| **1. MVP social** | Cuatro vistas: **Home** (feed), **Crear post**, **Detalle de post** y **Comunidades**. Incluye posts (Text, Image, Poll), menciones `$ # @`, comentarios anidados y votos. El front consume el backend y la base de datos existentes. **Sin login**: llega en una fase posterior |
| **2. Tesis y reputación** | Tesis con resolución automática, accuracy, racha, rating, perfil con track record, página de activo, búsqueda, formatos Thought y Portfolio |
| **3. Tiempo real** | Lives, alertas de mercado, notificaciones |
| **4. Economía** | Tokens, stakes en tesis, Finance Duel, propinas, avatar, monetización de creadores. **Requiere validación legal antes del spec** |
| **Posterior** | Acciones en el catálogo de `$` |

## Fuera de alcance (por ahora)

- Acciones, ETFs y divisas como activos mencionables.
- Ejecutar operaciones o conectar exchanges y brokers.
- Recomendaciones personalizadas de inversión.

## Decisiones abiertas

- [ ] Proveedor de precios de cripto para resolver tesis.
- [ ] Mercado inicial.
- [ ] En el MVP no hay página de activo ni perfil: ¿a dónde lleva hacer clic en una mención `$` o `@`?
- [ ] Encuadre legal de la economía de tokens (juego/predicción, asesoramiento financiero).
- [ ] Reglas de moderación y proceso de disputa de tesis.
