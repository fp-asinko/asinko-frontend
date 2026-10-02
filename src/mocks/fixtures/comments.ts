import type { RawComment } from '@/lib/api/contract'
import { hoursAgo, minutesAgo, mockId } from './ids'
import { POSTS } from './posts'
import { POLLS } from './polls'
import { summary } from './users'

let counter = 0

type Seed = { author: string; body: string; ago: string; score?: number } & Partial<
  Omit<RawComment, 'author'>
>

/** Builds a comment and its nested replies, wiring parentCommentId and replyCount. */
function comment(seed: Seed, replies: Array<(parentId: string) => RawComment> = []) {
  return (parentId: string | null = null): RawComment => {
    counter += 1
    const id = mockId(6, counter)
    const { author, ago, ...rest } = seed
    const children = replies.map((build) => build(id))
    return {
      id,
      author: summary(author),
      parentCommentId: parentId,
      side: null,
      score: 0,
      viewerVote: null,
      editedAt: null,
      deleted: false,
      createdAt: ago,
      ...rest,
      replyCount: children.length,
      replies: children,
    }
  }
}

const thread = (...roots: Array<(parentId?: string | null) => RawComment>) =>
  roots.map((build) => build(null))

const [whales, fed, ethBtc, dogeMeme, stableYields, cnv] = POSTS

// Comments by content id (posts and polls share the same endpoint shape).
export const COMMENTS_BY_CONTENT: Record<string, RawComment[]> = {
  [whales!.id]: thread(
    comment(
      {
        author: 'jeppe',
        body: 'Great data. Do you exclude exchange cold wallets? They often look like whales.',
        ago: minutesAgo(30),
        score: 88,
      },
      [
        comment(
          {
            author: 'maria',
            body: 'Sí, las excluyo con los labels de Arkham. Quedan solo wallets no custodiales.',
            ago: minutesAgo(26),
            score: 54,
          },
          [
            comment({
              author: 'quantsimula',
              body: 'Igual hay un margen de error de 5–8% en esos labels. Ojo.',
              ago: minutesAgo(20),
              score: 12,
            }),
          ],
        ),
      ],
    ),
    comment({
      author: 'diamondgrandma',
      body: 'Yo también acumulé. 0,01 BTC pero cuenta 😂',
      ago: minutesAgo(18),
      score: 41,
      viewerVote: 1,
    }),
    comment(
      {
        author: 'capitalprudente',
        body: '[comentario eliminado]',
        ago: minutesAgo(15),
        deleted: true,
      },
      [
        comment({
          author: 'federico',
          body: 'Respondía a algo que ya no está, pero el punto sigue: las ballenas también se equivocan.',
          ago: minutesAgo(10),
          score: 7,
        }),
      ],
    ),
  ),
  [fed!.id]: thread(
    comment(
      {
        author: 'federico',
        body: 'El dot plot muestra dos recortes más en 2027. Eso es lo que movió al mercado.',
        ago: hoursAgo(1.5),
        score: 63,
      },
      [
        comment({
          author: 'macropilar',
          body: 'Exacto. Y el tono de Powell fue más dovish de lo esperado.',
          ago: hoursAgo(1.2),
          score: 22,
          editedAt: hoursAgo(1),
        }),
      ],
    ),
    comment({
      author: 'esmev',
      body: 'No Brasil o efeito foi o contrário: o real se valorizou.',
      ago: hoursAgo(1),
      score: 9,
    }),
  ),
  [ethBtc!.id]: thread(
    comment(
      {
        author: 'federico',
        body: 'Te respondí en un post aparte, no entraba acá.',
        ago: hoursAgo(2.5),
        score: 15,
      },
      [
        comment({
          author: 'jeppe',
          body: 'Read it. Fair points on staking ETFs, still not convinced.',
          ago: hoursAgo(2),
          score: 9,
        }),
      ],
    ),
  ),
  [dogeMeme!.id]: thread(
    comment({ author: 'jeppe', body: 'Pain. Pure pain.', ago: hoursAgo(3.5), score: 120 }),
    comment({
      author: 'quantsimula',
      body: 'Y si hubieras holdeado desde 2021, -70%.',
      ago: hoursAgo(3),
      score: 64,
    }),
  ),
  [stableYields!.id]: thread(
    comment({
      author: 'maria',
      body: 'Morpho tiene mejor relación riesgo/rendimiento hoy.',
      ago: hoursAgo(4),
      score: 18,
    }),
    comment({
      author: 'macropilar',
      body: 'Con 4% en T-bills, DeFi no compensa el riesgo.',
      ago: hoursAgo(3.8),
      score: 25,
    }),
  ),
  [cnv!.id]: thread(
    comment({
      author: 'capitalprudente',
      body: '¿Esto aplica a exchanges extranjeros también?',
      ago: hoursAgo(6),
      score: 3,
    }),
  ),
  [POLLS[0]!.id]: thread(
    comment({ author: 'jeppe', body: '150k is conservative.', ago: minutesAgo(40), score: 11 }),
  ),
}
