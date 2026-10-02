import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ScorePill } from './score-pill'

describe('ScorePill', () => {
  it('announces the score', () => {
    renderWithIntl(<ScorePill score={1284} viewerVote={null} />)
    expect(screen.getByText('1,284 points')).toBeInTheDocument()
  })

  it('announces the viewer vote, not only with color (H-23)', () => {
    const { unmount } = renderWithIntl(<ScorePill score={1} viewerVote={1} />)
    expect(screen.getByText('1 point, you upvoted')).toBeInTheDocument()
    unmount()
    renderWithIntl(<ScorePill score={-3} viewerVote={-1} />)
    expect(screen.getByText('-3 points, you downvoted')).toBeInTheDocument()
  })
})
