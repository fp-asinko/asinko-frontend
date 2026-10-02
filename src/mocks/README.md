# Mocks

Endpoints answered locally when `API_MOCKS=true` (never in production). See `docs/ai-guidelines/api-integration.md § Mocks`.

| Method | Path                              | Kind     | Notes                                                                |
| ------ | --------------------------------- | -------- | -------------------------------------------------------------------- |
| GET    | `/api/v1/profiles/:identifier`    | contract | Implemented in the backend (E01). `liveExample` for `pnpm api:smoke` |
| GET    | `/api/v1/users/:userId/following` | contract | E01. Users the demo viewer follows (maria, federico, jeppe)          |
| GET    | `/api/v1/communities`             | contract | E02. `search`, `type`, `cursor`                                      |
| GET    | `/api/v1/communities/:slug`       | contract | E02                                                                  |
| GET    | `/api/v1/feed/explore`            | contract | E04. Posts + polls, newest first. `community`, `cursor`              |
| GET    | `/api/v1/feed/following`          | contract | E04. Communities the demo user belongs to: `btc`, `defi`, `latam`    |
| GET    | `/api/v1/posts/:id`               | contract | E03, with `entities` (proposal P-001)                                |
| GET    | `/api/v1/polls/:id`               | contract | E03                                                                  |
| PUT    | `/api/v1/posts/:id/vote`          | contract | E05. Stateless: computed from the fixtures (`votes.ts`)              |
| DELETE | `/api/v1/posts/:id/vote`          | contract | E05                                                                  |
| PUT    | `/api/v1/polls/:id/vote`          | contract | E03. Reveals hidden results; `POLL_CLOSED`, `VOTE_LOCKED`            |
| GET    | `/api/v1/posts/:id/comments`      | contract | E05, replies nested                                                  |
| GET    | `/api/v1/polls/:id/comments`      | contract | E05                                                                  |
| GET    | `/api/v1/assets`                  | contract | E14. Response shape assumed (proposal P-003). `q`, `cursor`          |
| GET    | `/api/v1/assets/:symbol`          | contract | E14. `openTheses` empty until phase 2                                |

- **contract**: in `docs/references/api/` but not implemented in the backend yet (or mocked to work without it).
- **proposal**: the frontend needs it and it is not in the contract; described in `docs/references/api/proposals.md`.

## Mock world

Deterministic data (fixed ids and a fixed "now", `fixtures/ids.ts`) designed to exercise the UI:

- **Users** (`fixtures/users.ts`): the demo user plus 8 profiles with different accuracy, points, badges and languages; one private profile.
- **Crypto** (`fixtures/assets.ts`): BTC, ETH, SOL, XRP, ADA, DOGE, LINK, AVAX (fictional prices). Ups, downs, a 0% day and a stale price (AVAX).
- **Communities** (`fixtures/communities.ts`): one of each type (asset, category, geo, user-created), with and without rules; the demo user is a member of five and moderates `trading-on-chain`.
- **Posts** (`fixtures/posts.ts`): 22 in es, en and pt. TEXT, IMAGE (SVGs in `public/mocks/`) and LINK; short and very long bodies; `$ # @` mentions; positive and negative scores; upvoted and downvoted by the viewer; edited, deleted and a system post.
- **Polls** (`fixtures/polls.ts`): open with results, results hidden until voting, and closed with the viewer's vote.
- **Comments** (`fixtures/comments.ts`): nested up to 3 levels, a deleted comment with replies, an edited one.

Adding a mock: register it in `handlers.ts` with its response `schema` (from `@/lib/api/contract`) and an `example`; add fixtures under `fixtures/` and a row here. `fixtures.test.ts` validates every fixture and handler against the contract and checks the data is consistent (unique ids, mention positions, comment counts). Remove the mock when the backend ships the endpoint.
