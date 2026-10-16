import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { EditableProfile, EditProfileField } from '../communities.types'
import { EditProfileDialog } from './edit-profile-dialog'

const action = vi.hoisted(() => ({ updateProfile: vi.fn() }))
vi.mock('../actions/update-profile.action', () => action)

const PROFILE: EditableProfile = {
  displayName: 'Juan',
  headline: null,
  countryCode: 'AR',
  city: null,
  bio: 'On-chain analyst.',
  avatarUrl: null,
  bannerUrl: null,
  links: ['https://x.com/juan'],
}

function renderDialog(
  profile: Partial<EditableProfile> = {},
  field: EditProfileField | null = null,
) {
  const onOpenChange = vi.fn()
  const onSaved = vi.fn()
  renderWithIntl(
    <EditProfileDialog
      layout="modal"
      open
      onOpenChange={onOpenChange}
      profile={{ ...PROFILE, ...profile }}
      field={field}
      onSaved={onSaved}
    />,
  )
  return { onOpenChange, onSaved }
}

const box = (name: string) => screen.getByRole('textbox', { name })
const save = () => screen.getByRole('button', { name: 'Save' })

describe('EditProfileDialog (specs/profile-edit, specs/profile-presentation PP-05 to PP-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    action.updateProfile.mockResolvedValue({ ok: true, data: null })
  })

  it('opens with what the profile has, in its sections, the focus on the name', async () => {
    renderDialog()
    expect(screen.getByRole('dialog', { name: 'Edit profile' })).toBeInTheDocument()
    expect(box('Name')).toHaveValue('Juan')
    expect(box('Headline')).toHaveValue('')
    expect(screen.getByRole('group', { name: 'Location' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('AR')
    expect(box('Bio')).toHaveValue('On-chain analyst.')
    expect(box('Bio')).toHaveAccessibleDescription(/17\/160/)
    expect(box('Link 1')).toHaveValue('https://x.com/juan')
    await vi.waitFor(() => expect(box('Name')).toHaveFocus())
  })

  it('opens on the field a prompt offered (PP-04)', async () => {
    renderDialog({}, 'headline')
    await vi.waitFor(() => expect(box('Headline')).toHaveFocus())
  })

  it('sends only what changed, then hands over and closes (PP-08)', async () => {
    const { onOpenChange, onSaved } = renderDialog()
    await userEvent.type(box('Headline'), 'Macro | Rates')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'BR')
    await userEvent.click(save())
    expect(action.updateProfile).toHaveBeenCalledWith({
      headline: 'Macro | Rates',
      countryCode: 'BR',
    })
    expect(onSaved).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('counts a text near its limit, and stops one past it (PP-05)', async () => {
    renderDialog()
    await userEvent.click(box('Headline'))
    await userEvent.paste('x'.repeat(79))
    expect(screen.queryByText('79/100')).toBeNull()
    await userEvent.type(box('Headline'), 'x')
    expect(screen.getByText('80/100')).toBeInTheDocument()
    await userEvent.paste('x'.repeat(21))
    expect(box('Headline')).toHaveAttribute('aria-invalid', 'true')
    expect(box('Headline')).toHaveAccessibleDescription(/Up to 100 characters/)
    expect(save()).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(save())
    expect(action.updateProfile).not.toHaveBeenCalled()
  })

  it('adds links up to five, with their mark, and takes one out (PP-06)', async () => {
    renderDialog()
    const links = screen.getByRole('group', { name: 'Links' })
    for (let added = 1; added < 5; added += 1) {
      await userEvent.click(within(links).getByRole('button', { name: 'Add link' }))
    }
    expect(within(links).getAllByRole('textbox')).toHaveLength(5)
    expect(within(links).queryByRole('button', { name: 'Add link' })).toBeNull()

    await userEvent.click(within(links).getByRole('button', { name: 'Remove link 3' }))
    expect(within(links).getAllByRole('textbox')).toHaveLength(4)
    await vi.waitFor(() => expect(box('Link 2')).toHaveFocus())
    expect(within(links).getByRole('button', { name: 'Add link' })).toBeInTheDocument()
  })

  it('says what is wrong with a link that is not http(s), and does not send it (PP-06)', async () => {
    renderDialog()
    await userEvent.clear(box('Link 1'))
    await userEvent.type(box('Link 1'), 'javascript:alert(1)')
    expect(
      await screen.findByText('Enter a link that starts with http:// or https://'),
    ).toBeInTheDocument()
    expect(box('Link 1')).toHaveAttribute('aria-invalid', 'true')
    await userEvent.click(save())
    expect(action.updateProfile).not.toHaveBeenCalled()
  })

  it('marks the field the backend refused, and keeps what was written (PP-09)', async () => {
    action.updateProfile.mockResolvedValue({
      ok: false,
      error: 'communities.edit.errors.link',
      fieldErrors: { links: ['communities.edit.errors.link'] },
    })
    const { onOpenChange } = renderDialog()
    await userEvent.type(box('Link 1'), '/more')
    await userEvent.click(save())
    expect(
      await screen.findByText('Enter a link that starts with http:// or https://'),
    ).toBeInTheDocument()
    expect(box('Link 1')).toHaveValue('https://x.com/juan/more')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('says a general failure, keeping what was written (PE-05)', async () => {
    action.updateProfile.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderDialog()
    await userEvent.type(box('Bio'), ' More.')
    await userEvent.click(save())
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save. Try again.')
    expect(box('Bio')).toHaveValue('On-chain analyst. More.')
  })

  it('asks before discarding changes, and closes at once without any (PE-03)', async () => {
    const view = renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(view.onOpenChange).toHaveBeenCalledWith(false)

    view.onOpenChange.mockClear()
    await userEvent.type(box('Bio'), ' More.')
    await userEvent.keyboard('{Escape}')
    expect(view.onOpenChange).not.toHaveBeenCalled()
    const confirm = await screen.findByRole('alertdialog', { name: 'Discard changes?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Discard' }))
    expect(view.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('says Saving… while it saves and never sends twice (PE-03)', async () => {
    action.updateProfile.mockReturnValue(new Promise(() => {}))
    renderDialog()
    await userEvent.type(box('Bio'), ' More.')
    await userEvent.click(save())
    const saving = await screen.findByRole('button', { name: 'Saving…' })
    expect(saving).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(saving)
    expect(action.updateProfile).toHaveBeenCalledOnce()
  })
})
