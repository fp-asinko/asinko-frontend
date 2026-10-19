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

  it('leaves out when it was created for a group of the system', () => {
    renderWithIntl(<CommunityAbout page={{ ...GROUP, createdAt: null }} idPrefix="x" />)
    expect(screen.queryByText(/Created/)).toBeNull()
  })
})
