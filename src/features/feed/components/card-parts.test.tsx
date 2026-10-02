import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { MARIA } from '../feed-items.fixture'
import { CardByline } from './card-byline'
import { ComposerPlaceholder } from './composer-placeholder'
import { FeedEmpty } from './feed-empty'
import { ScorePill } from './score-pill'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const hourAgo = () => new Date(Date.now() - 3600_000).toISOString()

describe('CardByline', () => {
  it('shows author, accuracy, community link and relative time', () => {
    renderWithIntl(
      <CardByline
        author={MARIA}
        community={{ slug: 'defi', name: 'DeFi', handle: '#defi' }}
        publishedAt={hourAgo()}
      />,
    )
    expect(screen.getByText('@maria')).toBeInTheDocument()
    expect(screen.getByText('74% accuracy')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '#defi' })).toHaveAttribute('href', '/?comunidad=defi')
    expect(screen.getByText('1 hour ago').tagName).toBe('TIME')
  })

  it('omits the community when it could not be resolved', () => {
    renderWithIntl(<CardByline author={MARIA} community={null} publishedAt={hourAgo()} />)
    expect(screen.queryByRole('link')).toBeNull()
  })
})

describe('ScorePill', () => {
  it('announces the score once and marks the viewer vote visually', () => {
    renderWithIntl(<ScorePill score={1} viewerVote={1} />)
    expect(screen.getByText('1 point')).toBeInTheDocument()
  })
})

describe('ComposerPlaceholder (H-09)', () => {
  it('shows the input and the Post / Thesis / Live actions as coming soon', () => {
    renderWithIntl(<ComposerPlaceholder viewerName="demo" />)
    for (const name of ['What are you thinking?', 'Post', 'Thesis', 'Live']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })
})

describe('FeedEmpty', () => {
  it('shows the message and an optional action', () => {
    renderWithIntl(<FeedEmpty message="Nothing here" action={<a href="#feed">Go</a>} />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go' })).toBeInTheDocument()
  })
})
