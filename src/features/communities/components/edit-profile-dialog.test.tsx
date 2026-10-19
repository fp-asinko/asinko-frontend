import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { EditableProfile, EditProfileField } from '../communities.types'
import { editProfileChangesSchema } from '../schemas/edit-profile.schema'
import { router } from '@/test/navigation-mock'
import { EditProfileDialog } from './edit-profile-dialog'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
const action = vi.hoisted(() => ({ updateProfile: vi.fn() }))
vi.mock('../actions/update-profile.action', () => action)
// The cropper has its own tests: here it applies or goes back at once.
vi.mock('./image-cropper', () => ({
  ImageCropper: ({
    kind,
    onApply,
    onBack,
  }: {
    kind: string
    onApply: (image: object) => void
    onBack: () => void
  }) => (
    <div>
      <p>Cropping {kind}</p>
      <button
        type="button"
        onClick={() =>
          onApply({ imageUrl: '/mocks/avatar-demo.svg', preview: '/mocks/avatar-demo.svg' })
        }
      >
        Apply crop
      </button>
      <button type="button" onClick={onBack}>
        Back from crop
      </button>
    </div>
  ),
}))

const PROFILE: EditableProfile = {
  username: 'demo',
  displayName: 'Juan',
  headline: null,
  countryCode: 'AR',
  city: null,
  bio: 'On-chain analyst.',
  avatarUrl: null,
  bannerUrl: null,
  openTo: [],
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
    expect(box('About')).toHaveValue('On-chain analyst.')
    expect(box('About')).toHaveAccessibleDescription(/17\/2000/)
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

  it('sends what the action takes: links as plain URLs (a bug: they went as objects)', async () => {
    renderDialog()
    await userEvent.type(box('Link 1'), '/more')
    await userEvent.click(save())
    const sent = action.updateProfile.mock.calls[0]![0]
    expect(sent).toEqual({ links: ['https://x.com/juan/more'] })
    expect(editProfileChangesSchema.safeParse(sent).success).toBe(true)
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
    // The focus goes to the link that takes its place.
    await vi.waitFor(() => expect(box('Link 3')).toHaveFocus())
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
    await userEvent.type(box('About'), ' More.')
    await userEvent.click(save())
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save. Try again.')
    expect(box('About')).toHaveValue('On-chain analyst. More.')
  })

  it('asks before discarding changes, and closes at once without any (PE-03)', async () => {
    const view = renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(view.onOpenChange).toHaveBeenCalledWith(false)

    view.onOpenChange.mockClear()
    await userEvent.type(box('About'), ' More.')
    await userEvent.keyboard('{Escape}')
    expect(view.onOpenChange).not.toHaveBeenCalled()
    const confirm = await screen.findByRole('alertdialog', { name: 'Discard changes?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Discard' }))
    expect(view.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('crops a picked photo in the window, and Save sends it (PP-07)', async () => {
    renderDialog({ bannerUrl: '/mocks/banner-demo.svg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.click(screen.getByRole('button', { name: 'Change photo' }))
    await userEvent.upload(input, new File(['x'], 'me.png', { type: 'image/png' }))
    expect(await screen.findByText('Cropping avatar')).toBeInTheDocument()
    // The form waits behind: Save too.
    expect(save()).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Apply crop' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove banner' }))
    await userEvent.click(save())
    expect(action.updateProfile).toHaveBeenCalledWith({
      avatarUrl: '/mocks/avatar-demo.svg',
      bannerUrl: null,
    })
  })

  it('takes the focus back to the Change that started cropping; Esc there is Back (WCAG 2.4.3)', async () => {
    const { onOpenChange } = renderDialog()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.click(screen.getByRole('button', { name: 'Change banner' }))
    await userEvent.upload(input, new File(['x'], 'me.png', { type: 'image/png' }))
    await screen.findByText('Cropping banner')
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalled()
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Change banner' })).toHaveFocus(),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Change photo' }))
    await userEvent.upload(input, new File(['x'], 'me.png', { type: 'image/png' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Apply crop' }))
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Change photo' })).toHaveFocus(),
    )
  })

  it('goes back from cropping with what was written', async () => {
    renderDialog()
    await userEvent.type(box('Headline'), 'Rates')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['x'], 'me.png', { type: 'image/png' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Back from crop' }))
    expect(box('Headline')).toHaveValue('Rates')
  })

  it('says Saving… while it saves and never sends twice (PE-03)', async () => {
    action.updateProfile.mockReturnValue(new Promise(() => {}))
    renderDialog()
    await userEvent.type(box('About'), ' More.')
    await userEvent.click(save())
    const saving = await screen.findByRole('button', { name: 'Saving…' })
    expect(saving).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(saving)
    expect(action.updateProfile).toHaveBeenCalledOnce()
  })

  it('saves what the person is open to (specs/profile-showcase PS-09)', async () => {
    const { onSaved } = renderDialog({ openTo: ['QUESTIONS'] })
    const group = screen.getByRole('group', { name: 'Open to' })
    expect(within(group).getByRole('checkbox', { name: 'Questions' })).toBeChecked()
    await userEvent.click(within(group).getByRole('checkbox', { name: 'Mentoring' }))
    await userEvent.click(within(group).getByRole('checkbox', { name: 'Questions' }))
    await userEvent.click(save())
    expect(action.updateProfile).toHaveBeenCalledWith({ openTo: ['MENTORING'] })
    expect(onSaved).toHaveBeenCalled()
  })

  it('says under Open to when the server refuses it (WCAG 3.3.1)', async () => {
    action.updateProfile.mockResolvedValue({
      ok: false,
      error: 'communities.edit.errors.openTo',
      fieldErrors: { openTo: ['communities.edit.errors.openTo'] },
    })
    renderDialog()
    await userEvent.click(screen.getByRole('checkbox', { name: 'AMAs' }))
    await userEvent.click(save())
    const group = screen.getByRole('group', { name: 'Open to' })
    expect(await within(group).findByText('Choose each option once, from the list')).toBeVisible()
    expect(group).toHaveAccessibleDescription(/Choose each option once/)
  })

  it.each([
    ['openTo', () => screen.getByRole('checkbox', { name: 'Questions' })],
    ['bio', () => box('About')],
    ['location', () => screen.getByRole('combobox', { name: 'Country' })],
    ['avatar', () => screen.getByRole('button', { name: /Change photo/ })],
  ] as const)('opens on %s when a step asks (PS-02)', async (field, target) => {
    renderDialog({}, field)
    await vi.waitFor(() => expect(target()).toHaveFocus())
  })

  it('does not offer "Complete your profile" while it is not hidden (PS-14)', async () => {
    renderDialog()
    expect(screen.queryByRole('button', { name: 'Show "Complete your profile"' })).toBeNull()
  })

  it('shows "Complete your profile" again: clears the cookie and refreshes the page (PS-14)', async () => {
    document.cookie = 'asinko-profile-checklist=hidden; path=/'
    renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Show "Complete your profile"' }))
    expect(document.cookie).not.toContain('asinko-profile-checklist=hidden')
    expect(router.refresh).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Show "Complete your profile"' })).toBeNull()
    expect(screen.getByText('You will see it again on your profile.')).toHaveFocus()
  })
})
