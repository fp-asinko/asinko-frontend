import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CardCommunity } from '../feed.types'
import { MARIA } from '../feed-items.fixture'
import { CardByline } from './card-byline'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))

const hourAgo = () => new Date(Date.now() - 3600_000).toISOString()

const defi = (overrides: Partial<CardCommunity> = {}): CardCommunity => ({
  slug: 'defi',
  name: 'DeFi',
  handle: '#defi',
  avatarUrl: null,
  personal: false,
  viewerIsMember: false,
  ...overrides,
})

describe('CardByline (specs/community-first)', () => {
  it('puts the group first and the author second, without a photo (CF-01, CF-02)', () => {
    renderWithIntl(
      <CardByline author={MARIA} community={defi()} publishedAt={hourAgo()} titleId="t" />,
    )
    const group = screen.getByRole('link', { name: '#defi' })
    expect(group).toHaveAttribute('href', '/?community=defi')
    // The symbol is gray, the name keeps the text color.
    expect(group.querySelector('span')).toHaveTextContent('#')
    expect(group.querySelector('span')).toHaveClass('text-muted-foreground')
    const author = screen.getByText('@maria')
    // The group comes before the author in reading order.
    expect(group.compareDocumentPosition(author) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('74% accuracy, high')).toBeInTheDocument()
    expect(screen.getByText('1 hour ago').tagName).toBe('TIME')
    // One avatar, the group's: the author has no photo (CF-02).
    const avatars = screen.getAllByTestId('user-avatar')
    expect(avatars).toHaveLength(1)
    expect(avatars[0]).toHaveTextContent('DE')
  })

  it('shows the group avatar image when there is one (CF-04)', () => {
    renderWithIntl(
      <CardByline
        author={MARIA}
        community={defi({ avatarUrl: '/mocks/defi.png' })}
        publishedAt={hourAgo()}
        titleId="t"
      />,
    )
    expect(screen.getByTestId('user-avatar').querySelector('img')).not.toBeNull()
  })

  it.each([
    ['not a member', false, true],
    ['without a session', null, true],
    ['a member', true, false],
  ] as const)('shows the join button when %s (CF-05)', (_, viewerIsMember, shown) => {
    renderWithIntl(
      <CardByline
        author={MARIA}
        community={defi({ viewerIsMember })}
        publishedAt={hourAgo()}
        titleId="t"
      />,
    )
    expect(screen.queryByRole('button', { name: 'Join #defi' }) !== null).toBe(shown)
  })

  it('has no join button on a deleted card (CF-05)', () => {
    renderWithIntl(
      <CardByline
        author={MARIA}
        community={defi()}
        publishedAt={hourAgo()}
        titleId="t"
        canJoin={false}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Join #defi' })).toBeNull()
  })

  it('shows a personal channel post in one line, with the author photo and no join (CF-03)', () => {
    renderWithIntl(
      <CardByline
        author={MARIA}
        community={defi({ slug: 'maria', handle: '#maria', personal: true })}
        publishedAt={hourAgo()}
        titleId="t"
      />,
    )
    expect(screen.getByText('@maria')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByTestId('user-avatar')).toHaveTextContent('MA')
  })

  it('shows a system item as Asinko and marks edits', () => {
    renderWithIntl(
      <CardByline author={null} community={defi()} publishedAt={hourAgo()} titleId="t" edited />,
    )
    expect(screen.getByText('Asinko')).toBeInTheDocument()
    expect(screen.getByText('edited')).toBeInTheDocument()
  })

  it.each([
    ['es', /hace 1 hora/, /74\s%\sde precisión, alta/, 'Unirse a #defi'],
    ['pt', /há 1 hora/, /74%\sde precisão, alta/, 'Participar de #defi'],
  ] as const)('formats time, accuracy and join in %s (H-22)', (locale, time, accuracy, join) => {
    renderWithIntl(
      <CardByline author={MARIA} community={defi()} publishedAt={hourAgo()} titleId="t" />,
      { locale },
    )
    expect(screen.getByText(time).tagName).toBe('TIME')
    expect(screen.getByText(accuracy)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: join })).toBeInTheDocument()
  })

  it.each([
    [0.74, 'high'],
    [0.55, 'medium'],
    [0.31, 'low'],
  ] as const)('names the accuracy tier of %s for screen readers (FC-03)', (accuracyRate, tier) => {
    renderWithIntl(
      <CardByline
        author={{ ...MARIA, accuracyRate }}
        community={defi()}
        publishedAt={hourAgo()}
        titleId="t"
      />,
    )
    expect(screen.getByText(new RegExp(`accuracy, ${tier}$`))).toBeInTheDocument()
  })
})
