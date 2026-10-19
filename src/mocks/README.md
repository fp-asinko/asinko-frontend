# Mocks

Endpoints answered locally (never in production). `API_MOCKS=true` mocks all of them with the demo user; `API_MOCKS=missing` only the ones the backend does not have yet (`implemented: false`: today the proposals P-019 to P-021, the profile's headline, city, links, banner and image uploads, and P-022, drafts). Handlers follow the backend's `dev` branch (`asinko-app` `0cdf243`): `?kind=` on the feeds, `?mine=true` on communities, an empty page for an unknown community. See `docs/ai-guidelines/api-integration.md § Mocks`.

| Method | Path                              | Kind     | Notes                                                                                     |
| ------ | --------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| GET    | `/api/v1/profiles/:identifier`    | contract | Implemented in the backend (E01). `liveExample` for `pnpm api:smoke`                      |
| GET    | `/api/v1/users/:userId/following` | contract | E01. Users the demo viewer follows (maria, federico, jeppe)                               |
| GET    | `/api/v1/communities`             | contract | E02. `search`, `type`, `cursor`                                                           |
| GET    | `/api/v1/communities/:slug`       | contract | E02                                                                                       |
| GET    | `/api/v1/feed/explore`            | contract | E04. Posts + polls, newest first. `community`, `cursor`                                   |
| GET    | `/api/v1/feed/following`          | contract | E04. Communities the demo user belongs to: `btc`, `defi`, `latam`                         |
| GET    | `/api/v1/posts/:id`               | contract | E03, with `entities` (proposal P-001)                                                     |
| GET    | `/api/v1/polls/:id`               | contract | E03                                                                                       |
| PUT    | `/api/v1/posts/:id/vote`          | contract | E05. Stateless: computed from the fixtures (`votes.ts`)                                   |
| DELETE | `/api/v1/posts/:id/vote`          | contract | E05                                                                                       |
| PUT    | `/api/v1/polls/:id/vote`          | contract | E03. Reveals hidden results; `POLL_CLOSED`, `VOTE_LOCKED`                                 |
| GET    | `/api/v1/posts/:id/comments`      | contract | P-014 (backend 2026-10-13), only with `?q=` (`when`): search, a flat list                 |
| GET    | `/api/v1/posts/:id/comments`      | contract | E05, replies nested. `sort` (P-014): every level; without it, oldest first as the backend |
| GET    | `/api/v1/polls/:id/comments`      | contract | E05                                                                                       |
| GET    | `/api/v1/assets`                  | contract | E14. Response shape assumed (proposal P-003). `q`, `cursor`                               |
| GET    | `/api/v1/assets/:symbol`          | contract | E14. `openTheses` empty until phase 2                                                     |
| PATCH  | `/api/v1/users/:userId`           | proposal | P-019, P-020, only with `headline`, `city`, `links` or `bannerUrl` in the body (`when`)   |
| GET    | `/api/v1/users/:userId/drafts`    | proposal | P-022. The demo user's drafts, in memory, newest first, up to 20 (one seeded)             |
| POST   | `/api/v1/drafts`                  | proposal | P-022. `409 DRAFT_LIMIT` past 20                                                          |
| PATCH  | `/api/v1/drafts/:draftId`         | proposal | P-022. Goes first in the list                                                             |
| DELETE | `/api/v1/drafts/:draftId`         | proposal | P-022                                                                                     |
| POST   | `/api/v1/uploads/avatar`          | proposal | P-021. Answers a fixture (`/mocks/avatar-demo.svg`), not the uploaded image               |
| POST   | `/api/v1/uploads/profile-banner`  | proposal | P-021. Answers a fixture (`/mocks/banner-demo.svg`)                                       |

- **contract**: in `docs/references/api/`. Every route but the assets is already implemented on the backend's `dev` branch; they stay here to work without the backend (CI, `API_MOCKS=true`).
- **proposal**: the frontend needs it and it is not in the contract; described in `docs/references/api/proposals.md`.
- **`when`**: a proposal that adds a parameter to an implemented endpoint is mocked only for the requests that carry it (`when: (query) => query.q !== undefined`), or a field to its body (`when: (query, body) => …`), and goes before the route of the whole endpoint: the first match wins. With `API_MOCKS=missing` the rest still goes to the backend; a search on a real post answers no results.

## Mock world

Deterministic data (fixed ids and a fixed "now", `fixtures/ids.ts`) designed to exercise the UI:

- **Users** (`fixtures/users.ts`): the demo user plus 8 profiles with different accuracy, points, badges and languages; one private profile.
- **Crypto** (`fixtures/assets.ts`): BTC, ETH, SOL, XRP, ADA, DOGE, LINK, AVAX (fictional prices). Ups, downs, a 0% day and a stale price (AVAX).
- **Communities** (`fixtures/communities.ts`): one of each type (asset, category, geo, user-created), with and without rules; the demo user is a member of five and moderates `trading-on-chain`.
- **Posts** (`fixtures/posts.ts`): 22 in es, en and pt. TEXT, IMAGE (SVGs in `public/mocks/`) and LINK; short and very long bodies; `$ # @` mentions; positive and negative scores; upvoted and downvoted by the viewer; edited, deleted and a system post.
- **Polls** (`fixtures/polls.ts`): open with results, results hidden until voting, and closed with the viewer's vote.
- **Comments** (`fixtures/comments.ts`): nested up to 3 levels, a deleted comment with replies, an edited one, and a long debate (~30) on the ETH/BTC post.

Adding a mock: register it in `handlers.ts` with its response `schema` (from `@/lib/api/contract`) and an `example`; add fixtures under `fixtures/` and a row here. `fixtures.test.ts` validates every fixture and handler against the contract and checks the data is consistent (unique ids, mention positions, comment counts). Remove the mock when the backend ships the endpoint.
