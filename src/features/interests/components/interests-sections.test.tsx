import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { Interests } from '../interests.types'
import { InterestsSections } from './interests-sections'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const interests: Interests = {
  assets: {
    ok: true,
    data: [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        changePct: 2.4,
        price: 64000,
        stale: false,
        communitySlug: 'btc',
      },
      {
        symbol: 'AVAX',
        name: 'Avalanche',
        changePct: -1.2,
        price: 30,
        stale: true,
        communitySlug: 'avax',
      },
    ],
  },
  people: { ok: true, data: [{ id: '1', username: 'maria', avatarUrl: null, accuracyRate: 0.74 }] },
  groups: {
    ok: true,
    data: [
      {
        slug: 'trading',
        name: 'Trading',
        description: 'On-chain',
        avatarUrl: null,
        isModerator: true,
      },
    ],
  },
  suggested: {
    ok: true,
    data: [{ slug: 'nft', name: 'NFT', memberCount: 1200, avatarUrl: null }],
  },
}

describe('InterestsSections', () => {
  it('renders the four collapsible sections, open by default', () => {
    renderWithIntl(<InterestsSections interests={interests} />)
    const region = screen.getByRole('region', { name: 'Your interests' })

    for (const name of ['Assets', 'People', 'Groups', 'Suggested']) {
      const heading = within(region).getByRole('heading', { name })
      expect(heading.closest('details')).toHaveAttribute('open')
    }
  })

  it('links assets and groups to the Home filtered by their community', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    expect(screen.getByRole('link', { name: 'Bitcoin (BTC)' })).toHaveAttribute(
      'href',
      '/?comunidad=btc',
    )
    expect(screen.getByRole('link', { name: /Trading/ })).toHaveAttribute(
      'href',
      '/?comunidad=trading',
    )
  })

  it('announces the change direction, stale prices and accuracy', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    expect(screen.getByText('Outdated price')).toBeInTheDocument()
    expect(screen.getByText('74% accuracy')).toBeInTheDocument()
    expect(screen.getByText('MOD')).toBeInTheDocument()
    expect(screen.getByText('1,200 members')).toBeInTheDocument()
  })

  it('shows join and create group as coming soon', async () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    const join = screen.getByRole('button', { name: 'Join NFT' })
    expect(join).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Create group' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await userEvent.click(join)
    expect(screen.getAllByRole('status').some((s) => s.textContent)).toBe(true)
  })

  it('shows an error per failed section without hiding the others (H-19)', () => {
    renderWithIntl(<InterestsSections interests={{ ...interests, people: { ok: false } }} />)

    expect(screen.getAllByText('Could not load this section.')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Bitcoin (BTC)' })).toBeInTheDocument()
  })

  it('shows the empty message of each section', () => {
    renderWithIntl(
      <InterestsSections
        interests={{
          assets: { ok: true, data: [] },
          people: { ok: true, data: [] },
          groups: { ok: true, data: [] },
          suggested: { ok: true, data: [] },
        }}
      />,
    )

    expect(screen.getByText('Join an asset community to see it here.')).toBeInTheDocument()
    expect(screen.getByText('You do not follow anyone yet.')).toBeInTheDocument()
    expect(screen.getByText('You are not in any group yet.')).toBeInTheDocument()
  })
})
