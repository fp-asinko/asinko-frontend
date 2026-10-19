import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { GroupAboutFoldView } from './group-aside'
import { GROUP, TEXT } from './widgets.fixture'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../../lib/community-api', () => ({ getCommunityPage: vi.fn() }))
vi.mock('../../lib/widgets-api', () => ({ getWidgets: vi.fn() }))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))

describe('GroupAboutFoldView (specs/community-widgets CW-04)', () => {
  it('folds the details and widgets under the header, closed on arrival', async () => {
    renderWithIntl(
      <GroupAboutFoldView page={GROUP} widgets={[TEXT]} markdown={(body) => <p>{body}</p>} />,
    )
    const fold = screen.getByRole('button', { name: 'About the community' })
    expect(fold).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(fold)
    expect(fold).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Welcome' })).toBeInTheDocument()
  })
})
