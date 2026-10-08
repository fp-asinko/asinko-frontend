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

// The ETH/BTC post's debate: 20 more comments with replies, ~30 in all (ads every 10).
const ETH_BTC_DEBATE = [
  comment(
    {
      author: 'maria',
      body: 'ETH/BTC at 0.035 is where it bounced in 2019. History rhymes.',
      ago: hoursAgo(2.4),
      score: 41,
    },
    [
      comment({
        author: 'quantsimula',
        body: 'Rhymes, but the supply story is different now. Burn is lower since the blobs.',
        ago: hoursAgo(2.3),
        score: 22,
      }),
      comment({
        author: 'maria',
        body: 'True, the fee burn barely covers issuance on quiet days.',
        ago: hoursAgo(2.2),
        score: 12,
      }),
    ],
  ),
  comment({
    author: 'quantsimula',
    body: 'I ran the ratio against funding rates. Capitulation needs negative funding for a week. Not there yet.',
    ago: hoursAgo(2.35),
    score: 63,
  }),
  comment(
    {
      author: 'macropilar',
      body: 'Rates matter more than the ratio. If the Fed keeps cutting, ETH outperforms risk-on.',
      ago: hoursAgo(2.3),
      score: 18,
    },
    [
      comment({
        author: 'federico',
        body: 'Only if the ETF flows follow. They have been flat for a month.',
        ago: hoursAgo(2.25),
        score: 7,
      }),
    ],
  ),
  comment({
    author: 'esmev',
    body: 'I keep stacking ETH every Friday. The ratio is noise for me.',
    ago: hoursAgo(2.2),
    score: 25,
  }),
  comment(
    {
      author: 'diamondgrandma',
      body: 'Sold half my ETH for BTC in 2022 and never looked back.',
      ago: hoursAgo(2.15),
      score: 3,
    },
    [
      comment({
        author: 'jeppe',
        body: 'Best trade of the cycle so far, honestly.',
        ago: hoursAgo(2.1),
        score: 14,
      }),
    ],
  ),
  comment({
    author: 'capitalprudente',
    body: 'For a retail investor in Argentina, BTC is the simpler savings story. ETH is a tech bet.',
    ago: hoursAgo(2.1),
    score: 30,
  }),
  comment({
    author: 'jeppe',
    body: 'Opportunity, but sized small. Ratios can trend for years.',
    ago: hoursAgo(2.05),
    score: 19,
  }),
  comment(
    {
      author: 'federico',
      body: 'The L2s took the fees. That is the whole thesis against ETH right now.',
      ago: hoursAgo(2),
      score: 52,
    },
    [
      comment({
        author: 'quantsimula',
        body: 'And the L2s pay ETH for blobs, so some of it comes back. Small, though.',
        ago: hoursAgo(1.95),
        score: 16,
      }),
      comment({
        author: 'macropilar',
        body: 'Small is the key word there.',
        ago: hoursAgo(1.9),
        score: 4,
      }),
    ],
  ),
  comment({
    author: 'maria',
    body: 'Watching staking yields: if they drop under T-bills, more selling.',
    ago: hoursAgo(1.85),
    score: 27,
  }),
  comment({
    author: 'esmev',
    body: 'Every cycle someone calls ETH dead at the bottom.',
    ago: hoursAgo(1.8),
    score: 44,
  }),
  comment(
    {
      author: 'quantsimula',
      body: 'Backtest: buying ETH/BTC after a 4-year low returned 2x in 3 of 4 cases. Small sample.',
      ago: hoursAgo(1.75),
      score: 71,
    },
    [
      comment({
        author: 'capitalprudente',
        body: 'Three of four is not a strategy, it is an anecdote.',
        ago: hoursAgo(1.7),
        score: 9,
      }),
    ],
  ),
  comment({
    author: 'macropilar',
    body: 'DXY breaking down would help both. The ratio follows liquidity.',
    ago: hoursAgo(1.65),
    score: 11,
  }),
  comment({
    author: 'diamondgrandma',
    body: 'I just want my grandson to stop texting me about the merge.',
    ago: hoursAgo(1.6),
    score: 38,
  }),
  comment({
    author: 'jeppe',
    body: 'Solana ate the retail activity. That is the part nobody prices.',
    ago: hoursAgo(1.55),
    score: 21,
  }),
  comment(
    {
      author: 'federico',
      body: 'I will write a thesis on this: ETH/BTC above 0.05 by mid 2027.',
      ago: hoursAgo(1.5),
      score: 33,
    },
    [
      comment({
        author: 'maria',
        body: 'I would take the other side. Post it and we see who is right.',
        ago: hoursAgo(1.45),
        score: 17,
      }),
    ],
  ),
  comment({
    author: 'capitalprudente',
    body: 'Is there a clean way to track the ratio here? The chart widget would help.',
    ago: hoursAgo(1.4),
    score: 2,
  }),
  comment({
    author: 'esmev',
    body: 'Gas is cheap, apps are cheap, nobody is using them. That is the problem.',
    ago: hoursAgo(1.35),
    score: 8,
  }),
  comment({
    author: 'quantsimula',
    body: 'Correlation with Nasdaq is higher for ETH than BTC this year. That explains most of it.',
    ago: hoursAgo(1.3),
    score: 29,
  }),
  comment({
    author: 'macropilar',
    body: 'Patience. Cuts take 6 to 9 months to reach risk assets.',
    ago: hoursAgo(1.25),
    score: 6,
  }),
  comment({
    author: 'maria',
    body: 'Final take: opportunity for the patient, capitulation for the leveraged.',
    ago: hoursAgo(1.2),
    score: 48,
  }),
]

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
    // A long discussion: enough comments for the ads between them (specs/post-detail-refresh).
    ...ETH_BTC_DEBATE,
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
