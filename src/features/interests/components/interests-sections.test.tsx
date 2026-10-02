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
        handle: '$BTC',
        symbol: 'BTC',
        name: 'Bitcoin',
        changePct: 2.4,
        price: 64000,
        stale: false,
        communitySlug: 'btc',
      },
      {
        handle: '$AVAX',
        symbol: 'AVAX',
        name: 'Avalanche',
        changePct: -1.2,
        price: 30,
        stale: true,
        communitySlug: 'avax',
      },
    ],
  },
  people: {
    ok: true,
    data: [{ handle: '@maria', id: '1', username: 'maria', avatarUrl: null, accuracyRate: 0.74 }],
  },
  groups: {
    ok: true,
    data: [
      {
        handle: '#trading',
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
    data: [{ handle: '#nft', slug: 'nft', name: 'NFT', memberCount: 1200, avatarUrl: null }],
  },
}

describe('InterestsSections', () => {
  it('renders the four collapsible sections, open by default', () => {
    renderWithIntl(<InterestsSections interests={interests} />)
    const region = screen.getByRole('region', { name: 'Your interests' })

    for (const name of ['Assets', 'People', 'Groups', 'Suggested']) {
      const heading = within(region).getByRole('heading', { name })
      expect(heading.closest('section')!.querySelector('details')).toHaveAttribute('open')
    }
  })

  it('links assets and groups to the Home filtered by their community', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    expect(screen.getByRole('link', { name: /^Bitcoin \$BTC/ })).toHaveAttribute(
      'href',
      '/?community=btc',
    )
    expect(screen.getByRole('link', { name: /^#trading MOD On-chain/ })).toHaveAttribute(
      'href',
      '/?community=trading',
    )
  })

  it('shows every entity with its mention symbol (H-07)', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    for (const handle of ['$BTC', '$AVAX', '@maria', '#trading', '#nft']) {
      expect(screen.getByText(handle)).toBeInTheDocument()
    }
  })

  it('announces the change direction, stale prices and accuracy', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    expect(screen.getByText('Outdated price')).toBeInTheDocument()
    expect(screen.getByText('74% accuracy')).toBeInTheDocument()
    expect(screen.getByText('MOD')).toBeInTheDocument()
    expect(screen.getByText('1,200 members')).toBeInTheDocument()
  })

  it('shows a coming-soon "more" for assets, people and groups (H-26)', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    for (const name of ['More assets', 'More people', 'More groups']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('shows join and create group as coming soon', async () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    const join = screen.getByRole('button', { name: 'Join #nft' })
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
    expect(screen.getByRole('link', { name: /^Bitcoin \$BTC/ })).toBeInTheDocument()
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
