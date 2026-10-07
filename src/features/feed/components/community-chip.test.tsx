import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { CommunityChip, CommunityChipSkeleton } from './community-chip'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('CommunityChip (H-14)', () => {
  it('names the community and links back to the unfiltered feed', () => {
    renderWithIntl(
      <CommunityChip
        params={parseFeedParams({ community: 'BTC', filter: 'polls' })}
        community={{ slug: 'BTC', name: 'Bitcoin', handle: '$BTC' }}
      />,
    )
    expect(screen.getByRole('link', { name: 'Remove the $BTC filter' })).toHaveAttribute(
      'href',
      '/?filter=polls',
    )
  })

  it('falls back to the slug when the name is unknown', () => {
    renderWithIntl(
      <CommunityChip params={parseFeedParams({ community: 'defi' })} community={null} />,
    )
    expect(screen.getByRole('link', { name: 'Remove the #defi filter' })).toBeInTheDocument()
  })

  it('keeps the chip place while the name arrives (no CLS), hidden from screen readers', () => {
    const { container } = renderWithIntl(<CommunityChipSkeleton />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
