import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FeaturedMenuContext } from '@/components/organisms/featured'
import { renderWithIntl } from '@/test/render-with-intl'
import type { FeaturedItem } from '../communities.types'
import { FeaturedSection } from './featured-section'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const ITEMS: FeaturedItem[] = [
  {
    kind: 'thesis',
    id: 't1',
    claim: 'BTC above $150K before December',
    state: 'correct',
    community: { handle: '$BTC', path: '/asset/BTC' },
  },
  {
    kind: 'post',
    id: 'p1',
    title: 'Whales accumulated 48,000 $BTC',
    path: '/post/p1/whales',
    community: { handle: '#defi', path: '/hub/defi' },
    score: 1284,
    commentCount: 6,
  },
  {
    kind: 'poll',
    id: 'q1',
    title: 'Where is the Fed going in December?',
    community: { handle: '#macro', path: '/hub/macro' },
    commentCount: 3,
  },
]

describe('FeaturedSection (specs/profile-showcase PS-05 to PS-07)', () => {
  it('shows each one as a card leading to its post, or to the Theses tab', () => {
    renderWithIntl(
      <FeaturedSection
        items={ITEMS}
        postsPath="/user/maria"
        thesesPath="/user/maria?tab=theses"
        own={false}
      />,
    )
    const section = screen.getByRole('region', { name: 'Featured' })
    const [thesis, post, poll] = within(section).getAllByRole('article')
    expect(within(thesis!).getByText('Correct')).toBeInTheDocument()
    expect(within(thesis!).getByRole('link')).toHaveAttribute('href', '/user/maria?tab=theses')
    expect(
      within(post!).getByRole('link', { name: 'Whales accumulated 48,000 $BTC' }),
    ).toHaveAttribute('href', '/post/p1/whales')
    expect(within(post!).getByText(/#defi · 1,284 points · 6 comments/)).toBeInTheDocument()
    // A poll has no page yet: to the profile's posts (specs/backend-answer-1020 BA-04).
    expect(within(poll!).getByText('Poll')).toBeInTheDocument()
    expect(within(poll!).getByRole('link')).toHaveAttribute('href', '/user/maria')
    expect(within(poll!).getByText('#macro · 3 comments')).toBeInTheDocument()
    // Someone else's: no "⋯".
    expect(within(section).queryByRole('button')).toBeNull()
  })

  it('offers "⋯" on each on your own profile', () => {
    renderWithIntl(
      <FeaturedMenuContext
        value={{
          isFeatured: (kind, id) => ['thesis:t1', 'post:p1', 'poll:q1'].includes(`${kind}:${id}`),
          full: false,
          max: 3,
          pending: false,
          set: vi.fn(),
        }}
      >
        <FeaturedSection
          items={ITEMS}
          postsPath="/user/demo"
          thesesPath="/user/demo?tab=theses"
          own
        />
      </FeaturedMenuContext>,
    )
    expect(
      screen.getByRole('button', { name: 'Options for the post Whales accumulated 48,000 $BTC' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Options for the thesis BTC above $150K before December',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Options for the poll Where is the Fed going in December?',
      }),
    ).toBeInTheDocument()
  })

  it('is not there without featured', () => {
    renderWithIntl(<FeaturedSection items={[]} postsPath="/x" thesesPath="/x" own />)
    expect(screen.queryByRole('region')).toBeNull()
  })
})
