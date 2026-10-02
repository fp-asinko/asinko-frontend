import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { GroupList } from './group-list'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const group = {
  handle: '#trading',
  slug: 'trading',
  name: 'Trading',
  description: 'On-chain flows',
  avatarUrl: null,
  isModerator: false,
}

describe('GroupList (H-07)', () => {
  it('links each group to the Home filtered by it; the name includes the description', () => {
    renderWithIntl(<GroupList groups={[group]} />)
    const link = screen.getByRole('link', { name: '#trading On-chain flows' })
    expect(link).toHaveAttribute('href', '/?community=trading')
    expect(screen.queryByText('MOD')).toBeNull()
  })

  it('labels the groups the viewer moderates, also in the link name', () => {
    renderWithIntl(<GroupList groups={[{ ...group, isModerator: true }]} />)
    expect(screen.getByRole('link')).toHaveAccessibleName('#trading MOD On-chain flows')
  })
})
