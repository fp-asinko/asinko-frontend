import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { FollowCounts } from './follow-counts'

const action = vi.hoisted(() => ({ loadPeople: vi.fn() }))
vi.mock('../actions/load-people.action', () => action)

const USER = '00000000-0000-4000-8000-000000000101'

function renderCounts() {
  renderWithIntl(
    <FollowCounts
      userId={USER}
      handle="@maria"
      isSelf={false}
      followers={<>12 followers</>}
      following={<>3 following</>}
    />,
  )
}

describe('FollowCounts and FollowListDialog (specs/follow-lists FL-01, FL-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    action.loadPeople.mockImplementation(async ({ source }: { source: { list: string } }) => ({
      ok: true,
      data: { items: <li>{source.list} row</li>, count: 1, nextCursor: null },
    }))
  })

  it('opens the lists on the tab touched, with real tabs that the arrows move', async () => {
    renderCounts()
    await userEvent.click(screen.getByRole('button', { name: '3 following' }))
    const dialog = await screen.findByRole('dialog', { name: '@maria' }, { timeout: 8000 })
    const following = within(dialog).getByRole('tab', { name: 'Following' })
    expect(following).toHaveAttribute('aria-selected', 'true')
    expect(await within(dialog).findByText('following row')).toBeInTheDocument()

    await userEvent.click(following)
    await userEvent.keyboard('{ArrowLeft}')
    expect(within(dialog).getByRole('tab', { name: 'Followers' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(await within(dialog).findByText('followers row')).toBeInTheDocument()
  })

  it('gives the focus back to the number that opened it', async () => {
    renderCounts()
    const followers = screen.getByRole('button', { name: '12 followers' })
    await userEvent.click(followers)
    const dialog = await screen.findByRole('dialog', { name: '@maria' }, { timeout: 8000 })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    await vi.waitFor(() => expect(followers).toHaveFocus())
  })
})
