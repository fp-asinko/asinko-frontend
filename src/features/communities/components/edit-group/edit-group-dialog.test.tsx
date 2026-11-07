import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { EditableGroup, EditGroupField } from '../../communities.types'
import { EditGroupDialog } from './edit-group-dialog'

const deps = vi.hoisted(() => ({
  updateGroup: vi.fn(),
  uploadGroupImage: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('../../actions/update-group.action', () => ({ updateGroup: deps.updateGroup }))
vi.mock('../../actions/upload-group-image.action', () => ({
  uploadGroupImage: deps.uploadGroupImage,
}))
vi.mock('@/components/organisms/toaster/notify', () => ({ notify: deps.notify }))
// The cropper has its own tests: here it hands back an image at once.
vi.mock('../create-group/group-image-cropper', () => ({
  GroupImageCropper: ({ onApply }: { onApply: (blob: Blob) => void }) => (
    <button type="button" onClick={() => onApply(new Blob(['img']))}>
      Apply crop
    </button>
  ),
}))

const GROUP: EditableGroup = {
  id: '00000000-0000-4000-8000-000000001001',
  slug: 'options-flow',
  handle: '#options-flow',
  name: 'Options Flow',
  description: 'Calls and puts.',
  rules: null,
  mainUrl: null,
  avatarUrl: null,
  bannerUrl: null,
}

function renderDialog(field: EditGroupField | null = null, group: Partial<EditableGroup> = {}) {
  const onOpenChange = vi.fn()
  const onSaved = vi.fn()
  renderWithIntl(
    <EditGroupDialog
      layout="modal"
      open
      onOpenChange={onOpenChange}
      group={{ ...GROUP, ...group }}
      field={field}
      onSaved={onSaved}
    />,
  )
  return { onOpenChange, onSaved }
}

const save = () => screen.getByRole('button', { name: 'Save' })

describe('EditGroupDialog (specs/community-edit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: vi.fn() }),
    )
    deps.updateGroup.mockResolvedValue({ ok: true, data: null })
    deps.uploadGroupImage.mockResolvedValue({ ok: true, data: { imageUrl: '/i.webp' } })
  })

  it('starts with what the group has, the handle shown but not editable (CE-02)', () => {
    renderDialog()
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Options Flow')
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Calls and puts.')
    expect(screen.getByText('#options-flow')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /Handle/ })).toBeNull()
    // Nothing changed yet: Save waits.
    expect(save()).toHaveAttribute('aria-disabled', 'true')
  })

  it('opens on the field a step asked for (CE-07)', async () => {
    renderDialog('rules')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Rules' })).toHaveFocus())
  })

  it('sends only what changed, an emptied text included, then closes with a toast (CE-03, CE-05)', async () => {
    const { onOpenChange, onSaved } = renderDialog()
    await userEvent.clear(screen.getByRole('textbox', { name: 'Description' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Rules' }), 'Be kind')
    await userEvent.click(save())
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(deps.updateGroup).toHaveBeenCalledWith('options-flow', {
      description: '',
      rules: 'Be kind',
    })
    expect(onSaved).toHaveBeenCalled()
    expect(deps.notify).toHaveBeenCalledWith({ message: 'Changes saved', kind: 'success' })
  })

  it('uploads a new image on Save, and removes one with null (CE-03, CE-05)', async () => {
    renderDialog(null, { bannerUrl: '/old-banner.webp' })
    await userEvent.click(screen.getByRole('button', { name: 'Change photo' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Upload image' }))
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['x'], 'a.png', { type: 'image/png' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Apply crop' }))
    expect(deps.uploadGroupImage).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Change banner' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }))
    await userEvent.click(save())
    await waitFor(() => expect(deps.updateGroup).toHaveBeenCalled())
    const sent = deps.uploadGroupImage.mock.calls[0]?.[0] as FormData
    expect(sent.get('kind')).toBe('avatar')
    expect(sent.get('communityId')).toBe(GROUP.id)
    expect(deps.updateGroup).toHaveBeenCalledWith('options-flow', { bannerUrl: null })
  })

  it('says why it could not save, and keeps what was written (CE-04, CE-06)', async () => {
    deps.updateGroup.mockResolvedValue({
      ok: false,
      error: 'createGroup.errors.rulesMax',
      fieldErrors: { rules: ['createGroup.errors.rulesMax'] },
    })
    const { onOpenChange } = renderDialog()
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Rules' }),
      'Too long, says the backend',
    )
    await userEvent.click(save())
    expect(await screen.findByText('The rules can have up to 2000 characters.')).toBeInTheDocument()

    deps.updateGroup.mockResolvedValue({
      ok: false,
      error: 'communities.editGroup.errors.notModerator',
    })
    await userEvent.type(screen.getByRole('textbox', { name: 'Rules' }), '!')
    await userEvent.click(save())
    expect(await screen.findByText('Only its moderators can edit this group.')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByRole('textbox', { name: 'Rules' })).toHaveValue(
      'Too long, says the backend!',
    )
  })

  it('asks before closing with changes, and closes at once without them (CE-04)', async () => {
    const { onOpenChange } = renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)

    onOpenChange.mockClear()
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).not.toHaveBeenCalled()
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
