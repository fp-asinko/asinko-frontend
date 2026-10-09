import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { EditProfileDialog } from './edit-profile-dialog'

const action = vi.hoisted(() => ({ updateProfile: vi.fn() }))
vi.mock('../actions/update-profile.action', () => action)

function renderDialog(bio: string | null = 'On-chain analyst.') {
  const onOpenChange = vi.fn()
  const onSaved = vi.fn()
  renderWithIntl(
    <EditProfileDialog
      layout="modal"
      open
      onOpenChange={onOpenChange}
      bio={bio}
      onSaved={onSaved}
    />,
  )
  return { onOpenChange, onSaved }
}

const field = () => screen.getByRole('textbox', { name: 'Bio' })
const save = () => screen.getByRole('button', { name: 'Save' })

describe('EditProfileDialog (specs/profile-edit PE-02 to PE-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    action.updateProfile.mockResolvedValue({ ok: true, data: { bio: 'Macro and rates.' } })
  })

  it('opens with the bio there is, the focus in it and its counter', async () => {
    renderDialog()
    expect(screen.getByRole('dialog', { name: 'Edit profile' })).toBeInTheDocument()
    expect(field()).toHaveValue('On-chain analyst.')
    expect(field()).toHaveAccessibleDescription(/17\/160/)
    await vi.waitFor(() => expect(field()).toHaveFocus())
  })

  it('saves the bio, then hands over and closes', async () => {
    const { onOpenChange, onSaved } = renderDialog()
    await userEvent.clear(field())
    await userEvent.type(field(), 'Macro and rates.')
    await userEvent.click(save())
    expect(action.updateProfile).toHaveBeenCalledWith({ bio: 'Macro and rates.' })
    expect(onSaved).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('marks a bio too long and does not send it (PE-04)', async () => {
    renderDialog('')
    await userEvent.click(field())
    await userEvent.paste('x'.repeat(161))
    expect(screen.getByText('161/160')).toBeInTheDocument()
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(field()).toHaveAccessibleDescription(/Up to 160 characters/)
    expect(save()).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(save())
    expect(action.updateProfile).not.toHaveBeenCalled()
  })

  it('keeps what was written and says when saving fails (PE-05)', async () => {
    action.updateProfile.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    const { onOpenChange } = renderDialog()
    await userEvent.type(field(), ' More.')
    await userEvent.click(save())
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save. Try again.')
    expect(field()).toHaveValue('On-chain analyst. More.')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('asks before discarding changes, and closes at once without any (PE-03)', async () => {
    const view = renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(view.onOpenChange).toHaveBeenCalledWith(false)

    view.onOpenChange.mockClear()
    await userEvent.type(field(), ' More.')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(view.onOpenChange).not.toHaveBeenCalled()
    const confirm = await screen.findByRole('alertdialog', { name: 'Discard changes?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Discard' }))
    expect(view.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('says Saving… while it saves and never sends twice (PE-03)', async () => {
    action.updateProfile.mockReturnValue(new Promise(() => {}))
    renderDialog()
    await userEvent.type(field(), ' More.')
    await userEvent.click(save())
    const saving = await screen.findByRole('button', { name: 'Saving…' })
    expect(saving).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(saving)
    expect(action.updateProfile).toHaveBeenCalledOnce()
  })

  it('closes with Esc, asking first if something changed (PE-03)', async () => {
    const view = renderDialog()
    await userEvent.keyboard('{Escape}')
    expect(view.onOpenChange).toHaveBeenCalledWith(false)

    view.onOpenChange.mockClear()
    await userEvent.type(field(), ' More.')
    await userEvent.keyboard('{Escape}')
    expect(await screen.findByRole('alertdialog', { name: 'Discard changes?' })).toBeInTheDocument()
    expect(view.onOpenChange).not.toHaveBeenCalled()
  })
})
