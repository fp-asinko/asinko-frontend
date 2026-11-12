import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { Interests } from '../interests.types'
import { InterestsSections } from './interests-sections'

// Its stars call a Server Action, which needs the env: not here (testing.md § Mocks).
vi.mock('@/lib/communities/set-favorite.action', () => ({ setFavorite: vi.fn() }))

vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const interests: Interests = {
  signedIn: true,
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
        priceUpdatedAt: null,
        logoUrl: null,
        assetClass: 'CRYPTO',
        communitySlug: 'BTC',
        favorite: false,
        path: '/asset/BTC',
      },
      {
        handle: '$AVAX',
        symbol: 'AVAX',
        name: 'Avalanche',
        changePct: -1.2,
        price: 30,
        stale: true,
        priceUpdatedAt: null,
        logoUrl: null,
        assetClass: 'CRYPTO',
        communitySlug: 'avax',
        favorite: false,
        path: '/asset/AVAX',
      },
    ],
  },
  people: {
    ok: true,
    data: [
      {
        handle: '@maria',
        path: '/user/maria',
        id: '1',
        username: 'maria',
        avatarUrl: null,
        accuracyRate: 0.74,
        channelSlug: 'maria',
        favorite: false,
      },
    ],
  },
  groups: {
    ok: true,
    data: [
      {
        handle: '#trading',
        slug: 'trading',
        path: '/hub/trading',
        name: 'Trading',
        description: 'On-chain',
        topPostTitle: null,
        memberCount: 3,
        avatarUrl: null,
        isModerator: true,
        favorite: false,
      },
    ],
  },
  suggested: {
    ok: true,
    data: [
      {
        handle: '#nft',
        slug: 'nft',
        path: '/hub/nft',
        name: 'NFT',
        memberCount: 1200,
        description: null,
        topPostTitle: null,
        avatarUrl: null,
      },
    ],
  },
}

describe('InterestsSections', () => {
  it('renders the four collapsible sections, open by default', () => {
    renderWithIntl(<InterestsSections interests={interests} />)
    const region = screen.getByRole('region', { name: 'Your interests' })

    // Groups, people, then assets (PO, 2026-10-21, specs/sidebar-fill SF-01).
    expect(
      within(region)
        .getAllByRole('heading')
        .map((heading) => heading.textContent),
    ).toEqual(['Groups', 'People', 'Assets', 'Suggested'])
    for (const name of ['Groups', 'Assets', 'People', 'Suggested']) {
      const heading = within(region).getByRole('heading', { name })
      expect(within(heading.closest('section')!).getByRole('button', { name })).toHaveAttribute(
        'aria-expanded',
        'true',
      )
    }
  })

  it('links assets and groups to their pages (specs/community-pages CP-14)', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    expect(screen.getByRole('link', { name: /^Bitcoin BTC/ })).toHaveAttribute('href', '/asset/BTC')
    expect(screen.getByRole('link', { name: /^trading MOD On-chain/ })).toHaveAttribute(
      'href',
      '/hub/trading',
    )
  })

  it('shows every entity by its name alone, without its symbol (H-07, PO 2026-10-26)', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    for (const handle of ['BTC', 'AVAX', 'maria', 'trading', 'nft']) {
      expect(screen.getByText(handle)).toBeInTheDocument()
    }
  })

  it('announces the change direction, stale prices and accuracy', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    // Once for screen readers, once in the sighted hint bubble.
    expect(screen.getAllByText('Outdated price')).toHaveLength(2)
    expect(screen.getByText('74% accuracy')).toBeInTheDocument()
    expect(screen.getByText('MOD')).toBeInTheDocument()
    expect(screen.getByText('1,200 members')).toBeInTheDocument()
  })

  it('gives the lists of groups, people and assets an id for their "more" (specs/sidebar-more)', () => {
    renderWithIntl(<InterestsSections interests={interests} />)
    for (const name of ['Groups', 'People', 'Assets']) {
      const list = screen.getByRole('region', { name }).querySelector('ul')
      expect(list?.id).toMatch(/.+/)
    }
    // Nothing is hidden without the column's height (jsdom): no "more" yet.
    expect(screen.queryByRole('button', { name: /^more:/ })).toBeNull()
  })

  it('joins for real, and Create group goes to its page (specs/community-create CG-01)', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    expect(screen.getByRole('button', { name: 'Join #nft' })).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('link', { name: 'Create group' })).toHaveAttribute(
      'href',
      '/create-group',
    )
  })

  it('puts Create group once, in the Groups header and not below its list (PO, 2026-11-12)', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    expect(screen.getAllByRole('link', { name: 'Create group' })).toHaveLength(1)
    const groups = screen.getByRole('region', { name: 'Groups' })
    const link = within(groups).getByRole('link', { name: 'Create group' })
    // Right after the title, not in the list and not a sibling of the section.
    expect(groups.querySelector('ul')).not.toContainElement(link)
    const toggle = within(groups).getByRole('button', { name: 'Groups' })
    expect(toggle).not.toContainElement(link)
    const title = within(groups).getByText('Groups', { selector: 'span[aria-hidden]' })
    expect(title.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      link.compareDocumentPosition([...toggle.parentElement!.querySelectorAll('svg')].at(-1)!),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    // No dashed link under the list any more.
    expect(link.className).not.toContain('border-dashed')
    expect(groups.nextElementSibling).not.toContainElement(link)
    // The other sections have no action.
    for (const name of ['People', 'Assets']) {
      expect(
        within(screen.getByRole('region', { name })).queryByRole('link', { name: 'Create group' }),
      ).toBeNull()
    }
  })

  it('shows an error per failed section without hiding the others (H-19)', () => {
    renderWithIntl(<InterestsSections interests={{ ...interests, people: { ok: false } }} />)

    expect(screen.getAllByText('Could not load this section.')).toHaveLength(1)
    expect(screen.getByRole('link', { name: /^Bitcoin BTC/ })).toBeInTheDocument()
  })

  it('shows the empty message of each section', () => {
    renderWithIntl(
      <InterestsSections
        interests={{
          signedIn: true,
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

  describe('without a session (decided 2026-10-03)', () => {
    const guest: Interests = { ...interests, signedIn: false }

    it('shows only communities: no assets, people, groups or create group', () => {
      renderWithIntl(<InterestsSections interests={guest} />)
      expect(screen.getByRole('region', { name: 'Communities' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /nft/ })).toBeInTheDocument()
      for (const name of ['Assets', 'People', 'Groups']) {
        expect(screen.queryByRole('heading', { name })).toBeNull()
      }
      expect(screen.queryByRole('button', { name: 'Create group' })).toBeNull()
    })

    it('starts with the invitation to join, above the communities (specs/guest-sidebar GS-01)', () => {
      renderWithIntl(<InterestsSections interests={guest} />)
      const join = screen.getByRole('region', { name: 'New to Asinko?' })
      const communities = screen.getByRole('region', { name: 'Communities' })
      expect(
        join.compareDocumentPosition(communities) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('has no invitation with a session', () => {
      renderWithIntl(<InterestsSections interests={interests} />)
      expect(screen.queryByRole('region', { name: 'New to Asinko?' })).toBeNull()
    })

    it('says when the communities could not be loaded', () => {
      renderWithIntl(<InterestsSections interests={{ ...guest, suggested: { ok: false } }} />)
      expect(screen.getByText('Could not load this section.')).toBeInTheDocument()
    })
  })
})
