import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { TEXT } from '../widgets.fixture'
import { EditWidgetsButton } from './edit-widgets-button'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../../../actions/save-widgets.action', () => ({ saveWidgets: vi.fn() }))
vi.mock('../../../actions/find-widget-communities.action', () => ({
  findWidgetCommunities: vi.fn(),
}))
vi.mock('../../../actions/upload-widget-image.action', () => ({ uploadWidgetImage: vi.fn() }))

describe('EditWidgetsButton (specs/community-widgets CW-08)', () => {
  it('opens "Edit widgets" with the group widgets, and closing gives the focus back', async () => {
    renderWithIntl(
      <EditWidgetsButton
        slug="trading-on-chain"
        communityId="00000000-0000-4000-8000-000000001009"
        widgets={[TEXT]}
      />,
    )
    const button = screen.getByRole('button', { name: 'Edit widgets' })
    expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    await userEvent.click(button)
    const dialog = await screen.findByRole('dialog', { name: 'Edit widgets' }, { timeout: 8000 })
    expect(dialog).toHaveTextContent('Welcome')
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(button).toHaveFocus())
  })
})
