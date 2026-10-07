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
            body: 'Yes, I exclude them with Arkham labels. Only non-custodial wallets are left.',
            ago: minutesAgo(26),
            score: 54,
          },
          [
            comment({
              author: 'quantsimula',
              body: 'Those labels still have a 5–8% error margin. Careful.',
              ago: minutesAgo(20),
              score: 12,
            }),
          ],
        ),
      ],
    ),
    comment(
      {
        author: 'diamondgrandma',
        body: 'I accumulated too. 0.01 BTC but it counts 😂',
        ago: minutesAgo(18),
        score: 41,
        viewerVote: 1,
      },
      [
        comment({
          author: 'jeppe',
          body: 'Every sat counts. Stacking is the whole strategy.',
          ago: minutesAgo(16),
          score: 9,
        }),
      ],
    ),
    comment(
      {
        author: 'capitalprudente',
        // P-008: empty body when deleted.
        body: '',
        ago: minutesAgo(15),
        deleted: true,
      },
      [
        comment({
          author: 'federico',
          body: 'Replying to something that is gone, but the point stands: whales get it wrong too.',
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
        body: 'The dot plot shows two more cuts in 2027. That is what moved the market.',
        ago: hoursAgo(1.5),
        score: 63,
      },
      [
        comment(
          {
            author: 'macropilar',
            body: 'Exactly. And Powell sounded more dovish than expected.',
            ago: hoursAgo(1.2),
            score: 22,
            editedAt: hoursAgo(1),
          },
          // A deep thread: from level 4 the detail folds the replies (specs/post-create-detail § 4).
          [
            comment(
              {
                author: 'federico',
                body: 'Dovish, but he kept saying "data dependent" five times.',
                ago: hoursAgo(1.1),
                score: 8,
              },
              [
                comment(
                  {
                    author: 'macropilar',
                    body: 'He always does. The dots matter more than the words.',
                    ago: hoursAgo(0.9),
                    score: 5,
                  },
                  [
                    comment({
                      author: 'jeppe',
                      body: 'Until the next CPI print changes the dots again.',
                      ago: hoursAgo(0.8),
                      score: 3,
                    }),
                  ],
                ),
              ],
            ),
          ],
        ),
      ],
    ),
    comment({
      author: 'esmev',
      body: 'In Brazil it was the opposite: the real got stronger.',
      ago: hoursAgo(1),
      score: 9,
    }),
  ),
  [ethBtc!.id]: thread(
    comment(
      {
        author: 'federico',
        body: 'I replied in a separate post, it did not fit here.',
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
      body: 'And if you had held since 2021, -70%.',
      ago: hoursAgo(3),
      score: 64,
    }),
  ),
  [stableYields!.id]: thread(
    comment({
      author: 'maria',
      body: 'Morpho has the better risk/return today.',
      ago: hoursAgo(4),
      score: 18,
    }),
    comment({
      author: 'macropilar',
      body: 'With 4% in T-bills, DeFi is not worth the risk.',
      ago: hoursAgo(3.8),
      score: 25,
    }),
  ),
  [cnv!.id]: thread(
    comment({
      author: 'capitalprudente',
      body: 'Does this apply to foreign exchanges too?',
      ago: hoursAgo(6),
      score: 3,
    }),
  ),
  [POLLS[0]!.id]: thread(
    comment({ author: 'jeppe', body: '150k is conservative.', ago: minutesAgo(40), score: 11 }),
  ),
}
