import type { PollResults } from '../feed.types'

/** Below this many votes "the majority" is a handful of people: only the results show (R1-Q1). */
export const CONSENSUS_MIN_VOTES = 5

export type Consensus = { tier: 'majority' | 'minority' | 'tie'; share: number }

/**
 * Where the viewer's vote stands (FC-05). Pure, so the poll computes it from the server's results
 * only, never from the optimistic state. null without a vote, with hidden results or few votes.
 */
export function pollConsensus({
  options,
  viewerOptionId,
  totalVotes,
}: Pick<PollResults, 'options' | 'viewerOptionId' | 'totalVotes'>): Consensus | null {
  if (viewerOptionId === null || totalVotes === null || totalVotes < CONSENSUS_MIN_VOTES)
    return null
  const mine = options.find((option) => option.id === viewerOptionId)
  if (!mine || mine.share === null) return null

  // Votes when known (exact ties), the share otherwise.
  const weight = (option: (typeof options)[number]) => option.votes ?? option.share ?? 0
  const top = Math.max(0, ...options.filter((option) => option !== mine).map(weight))
  const tier = weight(mine) > top ? 'majority' : weight(mine) === top ? 'tie' : 'minority'
  return { tier, share: mine.share }
}
