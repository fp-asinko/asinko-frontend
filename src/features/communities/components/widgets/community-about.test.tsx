import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { CommunityAbout } from './community-about'
import { GROUP } from './widgets.fixture'
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('CommunityAbout (specs/community-widgets CW-05)', () => {
  it('says what the group is, when it was created, its members and that it is public', () => {
    renderWithIntl(
      <CommunityAbout page={GROUP} idPrefix="x" action={<button type="button">Edit</button>} />,
    )
    const about = screen.getByRole('region', { name: 'Trading on-chain' })
    expect(about).toHaveTextContent('Flows of wallets, exchanges and whales.')
    expect(about).toHaveTextContent('Created Jun 3, 2026')
    expect(about).toHaveTextContent('1,204 members')
    expect(about).toHaveTextContent('Public')
    expect(within(about).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('shows its rules and its website, leading to it in a new tab (PO, 2026-11-09)', () => {
    renderWithIntl(
      <CommunityAbout
        page={{
          ...GROUP,
          rules: '1. Be kind.\n2. No spam.',
          mainUrl: { url: 'https://example.com/club', domain: 'example.com' },
        }}
        idPrefix="x"
      />,
    )
    const rules = screen.getByRole('region', { name: 'Rules' })
    expect(rules).toHaveTextContent('1. Be kind. 2. No spam.')
    const site = screen.getByRole('link', { name: 'example.com (opens in a new tab)' })
    expect(site).toHaveAttribute('href', 'https://example.com/club')
    expect(site).toHaveAttribute('target', '_blank')
    expect(site).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc')
  })

  it('without rules nor website, shows neither', () => {
    renderWithIntl(<CommunityAbout page={GROUP} idPrefix="x" />)
    expect(screen.queryByRole('region', { name: 'Rules' })).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('leaves out when it was created for a group of the system', () => {
    renderWithIntl(<CommunityAbout page={{ ...GROUP, createdAt: null }} idPrefix="x" />)
    expect(screen.queryByText(/Created/)).toBeNull()
  })
})
