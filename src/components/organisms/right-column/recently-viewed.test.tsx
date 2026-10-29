import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recordRecent } from '@/lib/recently-viewed'
import { renderWithIntl } from '@/test/render-with-intl'
import { RecentlyViewed } from './recently-viewed'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const post = (id: string, title: string, label = '$BTC') => ({
  id,
  href: `/post/${id}/slug`,
  label,
  title,
  kind: 'post' as const,
  score: 892,
  comments: 156,
})

describe('RecentlyViewed (specs/recently-viewed)', () => {
  beforeEach(() => localStorage.clear())

  it('lists the posts opened, newest first, each a link that reads in full (RV-02, RV-07)', () => {
    recordRecent(post('a', 'Can BTC close above $100K?'), new Date(Date.now() - 60 * 60_000))
    recordRecent(post('b', 'META to $800', '#wsb'))
    renderWithIntl(<RecentlyViewed />)

    const section = screen.getByRole('region', { name: 'Recently viewed' })
    const links = within(section).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/post/b/slug', '/post/a/slug'])
    expect(links[1]).toHaveAccessibleName(
      /^BTC: 1h ago Can BTC close above \$100K\? 892 votes 156 comments Post$/,
    )
    expect(within(links[1]!).getByText('892')).toBeInTheDocument()
  })

  it('clears the list, says so, and keeps the focus in the block (RV-05, WCAG 2.4.3)', async () => {
    recordRecent(post('a', 'One'))
    renderWithIntl(<RecentlyViewed />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear recently viewed' }))
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Nothing viewed yet')
    expect(screen.getByRole('heading', { name: 'Recently viewed' })).toHaveFocus()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('marks a thought as such, with its text (specs/thoughts)', () => {
    recordRecent({ ...post('t', 'Rates first, risk later.', '@maria'), kind: 'thought' as const })
    renderWithIntl(<RecentlyViewed />)
    expect(screen.getByRole('link')).toHaveAccessibleName(
      /^maria: .* “Rates first, risk later\.” .*Thought$/,
    )
    // As on its card: in italics and in quotes (PO, 2026-10-29).
    expect(screen.getByText('“Rates first, risk later.”')).toHaveClass('italic')
  })

  it('says "now" within the last minute', () => {
    recordRecent(post('a', 'Just opened'), new Date(Date.now() - 20_000))
    renderWithIntl(<RecentlyViewed />)
    expect(screen.getByRole('link')).toHaveAccessibleName(/^BTC: now Just opened/)
  })

  it('shows nothing that another page wrote into the storage (untrusted)', () => {
    localStorage.setItem(
      'asinko:recently-viewed',
      JSON.stringify([
        {
          id: 'x',
          href: 'https://evil.example/post/x',
          label: '$BTC',
          title: 'Free money',
          kind: 'post',
          score: 1,
          comments: 1,
          viewedAt: new Date().toISOString(),
        },
      ]),
    )
    renderWithIntl(<RecentlyViewed />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Nothing viewed yet')).toBeInTheDocument()
  })

  it('follows a post opened meanwhile (RV-06)', () => {
    renderWithIntl(<RecentlyViewed />)
    expect(screen.getByText('Nothing viewed yet')).toBeInTheDocument()
    act(() => recordRecent(post('c', 'Fresh one')))
    expect(screen.getByRole('link', { name: /Fresh one/ })).toBeInTheDocument()
  })

  it('speaks Spanish', () => {
    renderWithIntl(<RecentlyViewed />, { locale: 'es' })
    expect(screen.getByRole('region', { name: 'Visto recientemente' })).toBeInTheDocument()
    expect(screen.getByText('Nada visto todavía')).toBeInTheDocument()
  })
})
