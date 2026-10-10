import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { MembersButton } from './members-button'

const action = vi.hoisted(() => ({ loadPeople: vi.fn() }))
vi.mock('../actions/load-people.action', () => action)

describe('MembersButton (specs/community-members CM-01, CM-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    action.loadPeople.mockResolvedValue({
      ok: true,
      data: { items: <li>ana</li>, count: 1, nextCursor: null },
    })
  })

  it("opens the community's members, and gives the focus back on closing", async () => {
    renderWithIntl(
      <MembersButton slug="defi" handle="#defi">
        1,204 members
      </MembersButton>,
    )
    const button = screen.getByRole('button', { name: '1,204 members' })
    expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    await userEvent.click(button)
    const dialog = await screen.findByRole(
      'dialog',
      { name: 'Members of #defi' },
      { timeout: 3000 },
    )
    // The focus goes into the window (CM-06).
    await vi.waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus(),
    )
    expect(await within(dialog).findByText('ana')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    await vi.waitFor(() => expect(button).toHaveFocus())
  })
})
