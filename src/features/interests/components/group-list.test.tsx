import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { identityIndex } from '@/lib/identity-color'
import { renderWithIntl } from '@/test/render-with-intl'
import { GroupList } from './group-list'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const group = {
  handle: '#trading',
  slug: 'trading',
  path: '/hub/trading',
  name: 'Trading',
  description: 'On-chain flows',
  topPostTitle: null,
  memberCount: 12,
  avatarUrl: null,
  isModerator: false,
}

describe('GroupList (H-07)', () => {
  it('links each group to the Home filtered by it; the name includes the description', () => {
    renderWithIntl(<GroupList groups={[group]} />)
    const link = screen.getByRole('link', { name: 'trading On-chain flows' })
    expect(link).toHaveAttribute('href', '/hub/trading')
    expect(screen.queryByText('MOD')).toBeNull()
  })

  it('says what is being talked about there before its description (specs/interests-refresh IR-01)', () => {
    renderWithIntl(<GroupList groups={[{ ...group, topPostTitle: '0DTE SPY calls into FOMC' }]} />)
    expect(screen.getByRole('link')).toHaveAccessibleName('trading 0DTE SPY calls into FOMC')
    expect(screen.queryByText('On-chain flows')).toBeNull()
  })

  it('says its members when there is no post nor description, as the suggestions', () => {
    renderWithIntl(<GroupList groups={[{ ...group, description: null }]} />)
    expect(screen.getByRole('link')).toHaveAccessibleName('trading 12 members')
  })

  it('labels the groups the viewer moderates, also in the link name', () => {
    renderWithIntl(<GroupList groups={[{ ...group, isModerator: true }]} />)
    expect(screen.getByRole('link')).toHaveAccessibleName('trading MOD On-chain flows')
  })

  it('colors the avatar by the slug, like the feed does (FC-01)', () => {
    renderWithIntl(
      <GroupList
        groups={[{ ...group, name: 'On-chain', slug: 'onchain', path: '/hub/onchain' }]}
      />,
    )
    expect(screen.getByTestId('user-avatar')).toHaveAttribute(
      'data-color',
      String(identityIndex('onchain')),
    )
  })
})
