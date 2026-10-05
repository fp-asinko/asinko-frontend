// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PollOption } from '../feed.types'
import { pollConsensus } from './poll-consensus'

const options = (...votes: number[]): PollOption[] => {
  const total = votes.reduce((sum, count) => sum + count, 0)
  return votes.map((count, index) => ({
    id: String(index),
    label: `Option ${index}`,
    votes: count,
    share: count / total,
  }))
}

describe('pollConsensus (FC-05)', () => {
  it('finds the majority', () => {
    expect(pollConsensus({ options: options(7, 3), viewerOptionId: '0', totalVotes: 10 })).toEqual({
      tier: 'majority',
      share: 0.7,
    })
  })

  it('finds the minority', () => {
    expect(
      pollConsensus({ options: options(7, 3), viewerOptionId: '1', totalVotes: 10 })?.tier,
    ).toBe('minority')
  })

  it('finds a tie at the top, but not below it', () => {
    expect(
      pollConsensus({ options: options(5, 5, 2), viewerOptionId: '1', totalVotes: 12 })?.tier,
    ).toBe('tie')
    expect(
      pollConsensus({ options: options(5, 5, 2), viewerOptionId: '2', totalVotes: 12 })?.tier,
    ).toBe('minority')
  })

  it('stays quiet with fewer than 5 votes (R1-Q1), without a vote or with hidden results', () => {
    expect(pollConsensus({ options: options(3, 1), viewerOptionId: '0', totalVotes: 4 })).toBeNull()
    expect(
      pollConsensus({ options: options(7, 3), viewerOptionId: null, totalVotes: 10 }),
    ).toBeNull()
    const hidden = options(7, 3).map((option) => ({ ...option, votes: null, share: null }))
    expect(pollConsensus({ options: hidden, viewerOptionId: '0', totalVotes: null })).toBeNull()
    expect(
      pollConsensus({ options: options(7, 3), viewerOptionId: 'x', totalVotes: 10 }),
    ).toBeNull()
  })

  it('falls back to the share when the votes are not known', () => {
    const shares = options(7, 3).map((option) => ({ ...option, votes: null }))
    expect(pollConsensus({ options: shares, viewerOptionId: '0', totalVotes: 10 })?.tier).toBe(
      'majority',
    )
  })
})
