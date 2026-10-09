import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { FollowListDialog } from './follow-list-dialog'

const action = vi.hoisted(() => ({ loadFollowList: vi.fn() }))
vi.mock('../actions/load-follow-list.action', () => action)

const USER = '00000000-0000-4000-8000-000000000101'

function renderDialog(layout: 'sheet' | 'modal' = 'modal') {
  const onOpenChange = vi.fn()
  const onTabChange = vi.fn()
  renderWithIntl(
    <FollowListDialog
      layout={layout}
      open
      onOpenChange={onOpenChange}
      tab="following"
      onTabChange={onTabChange}
      userId={USER}
      handle="@maria"
      isSelf={false}
    />,
  )
  return { onOpenChange, onTabChange }
}

describe('FollowListDialog (specs/follow-lists FL-01, FL-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    action.loadFollowList.mockResolvedValue({
      ok: true,
      data: { items: <li>row</li>, count: 1, nextCursor: null },
    })
  })

  it('is named by the person, with the chosen tab selected and focused', async () => {
    renderDialog()
    const dialog = screen.getByRole('dialog', { name: '@maria' })
    const following = within(dialog).getByRole('tab', { name: 'Following' })
    expect(following).toHaveAttribute('aria-selected', 'true')
    await vi.waitFor(() => expect(following).toHaveFocus())
  })

  it('moves between tabs with the arrows, telling the parent', async () => {
    const { onTabChange } = renderDialog()
    await vi.waitFor(() => expect(screen.getByRole('tab', { name: 'Following' })).toHaveFocus())
    await userEvent.keyboard('{ArrowLeft}')
    expect(onTabChange).toHaveBeenCalledWith('followers')
  })

  it('closes with × in a window and with Close in the full screen', async () => {
    const modal = renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(modal.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('says Close in words in the full screen of a phone', () => {
    renderDialog('sheet')
    expect(screen.getByRole('button', { name: 'Close' })).toHaveTextContent('Close')
  })
})
