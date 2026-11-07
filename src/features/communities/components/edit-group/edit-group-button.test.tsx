import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { EditGroupButton, EditGroupPrompt, EditGroupProvider } from './edit-group-button'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
// The real window, without its actions (they need the env).
vi.mock('../../actions/update-group.action', () => ({ updateGroup: vi.fn() }))
vi.mock('../../actions/upload-group-image.action', () => ({ uploadGroupImage: vi.fn() }))

const GROUP = {
  id: '00000000-0000-4000-8000-000000001001',
  slug: 'options-flow',
  handle: '#options-flow',
  name: 'Options Flow',
  description: null,
  rules: null,
  mainUrl: null,
  avatarUrl: null,
  bannerUrl: null,
}

describe('EditGroupButton (specs/community-edit CE-01, CE-07)', () => {
  it('loads nothing until opened, then opens the window', async () => {
    renderWithIntl(
      <EditGroupProvider group={GROUP}>
        <EditGroupButton />
      </EditGroupProvider>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Edit group' }))
    expect(await screen.findByRole('dialog', { name: 'Edit group' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus())
  })

  it('opens it on the field a step asks for', async () => {
    renderWithIntl(
      <EditGroupProvider group={GROUP}>
        <EditGroupPrompt field="rules">Write its rules</EditGroupPrompt>
      </EditGroupProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Write its rules' }))
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Rules' })).toHaveFocus())
  })
})
