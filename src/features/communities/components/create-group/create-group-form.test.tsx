import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { CreateGroupForm } from './create-group-form'

const deps = vi.hoisted(() => ({
  createGroup: vi.fn(),
  uploadGroupImage: vi.fn(),
  checkGroupSlug: vi.fn(),
  findSimilarGroups: vi.fn(),
  openGate: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('@/components/organisms/toaster/notify', () => ({ notify: deps.notify }))
vi.mock('../../actions/create-group.action', () => ({ createGroup: deps.createGroup }))
vi.mock('../../actions/upload-group-image.action', () => ({
  uploadGroupImage: deps.uploadGroupImage,
}))
vi.mock('../../actions/check-group-slug.action', () => ({ checkGroupSlug: deps.checkGroupSlug }))
vi.mock('../../actions/find-similar-groups.action', () => ({
  findSimilarGroups: deps.findSimilarGroups,
}))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('@/components/organisms/auth-gate', async (original) => ({
  ...(await original<object>()),
  useAuthGate: () => ({ openGate: deps.openGate }),
}))
// The cropper hands back the image as soon as it opens: its own test crops.
vi.mock('./group-image-cropper', () => ({
  GroupImageCropper: ({ onApply }: { onApply: (blob: Blob) => void }) => (
    <button type="button" onClick={() => onApply(new Blob(['img']))}>
      Apply crop
    </button>
  ),
}))

const name = () => screen.getByRole('textbox', { name: /Name/ })
const handle = () => screen.getByRole('textbox', { name: /Handle/ })
const create = () => screen.getByRole('button', { name: 'Create group' })

describe('CreateGroupForm (specs/community-create)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: vi.fn() }),
    )
    deps.checkGroupSlug.mockResolvedValue('free')
    deps.findSimilarGroups.mockResolvedValue([])
    deps.createGroup.mockResolvedValue({ ok: true, data: { id: 'g1', slug: 'dividendos-latam' } })
    deps.uploadGroupImage.mockResolvedValue({ ok: true, data: { imageUrl: '/i.webp' } })
  })

  it('numbers its six steps and marks the optional ones (CG-03)', () => {
    renderWithIntl(<CreateGroupForm />)
    expect(name()).toHaveAccessibleName(/Step 1 of 6.*Name/)
    expect(handle()).toHaveAccessibleName(/Step 2 of 6.*Handle/)
    expect(screen.getByRole('textbox', { name: /Description \(optional\)/ })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Rules \(optional\)/ })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Website \(optional\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change banner' })).toBeInTheDocument()
  })

  it('makes the handle from the name until it is edited, and says it is free (CG-05, CG-06)', async () => {
    renderWithIntl(<CreateGroupForm />)
    await userEvent.type(name(), 'Dividendos LatAm')
    expect(handle()).toHaveValue('dividendos-latam')
    expect(await screen.findByText('#dividendos-latam is available')).toBeInTheDocument()

    await userEvent.clear(handle())
    await userEvent.type(handle(), 'divs')
    await userEvent.type(name(), '!')
    expect(handle()).toHaveValue('divs')
  })

  it('says a handle out of format without asking the backend (CG-07)', async () => {
    renderWithIntl(<CreateGroupForm />)
    await userEvent.type(handle(), 'Bad Handle')
    await userEvent.tab()
    expect(await screen.findByText(/Use 3 to 30 lowercase letters/)).toBeInTheDocument()
    expect(deps.checkGroupSlug).not.toHaveBeenCalled()
  })

  it('shows the counter near the limit (CG-04)', async () => {
    renderWithIntl(<CreateGroupForm />)
    expect(screen.queryByText(/\/50$/)).toBeNull()
    await userEvent.type(name(), 'a'.repeat(40))
    expect(screen.getByText('40/50')).toBeInTheDocument()
  })

  it('waits for the name and the handle, then creates the group and goes to its page (CG-09, CG-10)', async () => {
    renderWithIntl(<CreateGroupForm />)
    expect(create()).toHaveAttribute('aria-disabled', 'true')
    await userEvent.type(name(), 'Dividendos LatAm')
    await userEvent.click(create())
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/hub/dividendos-latam'))
    expect(deps.createGroup).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dividendos LatAm', slug: 'dividendos-latam' }),
    )
    expect(deps.uploadGroupImage).not.toHaveBeenCalled()
    // On its page, a toast says it is ready (CG-21).
    expect(deps.notify).toHaveBeenCalledWith({ message: 'Your group is ready', kind: 'success' })
  })

  it('uploads the images once the group exists (CG-09, Q5)', async () => {
    renderWithIntl(<CreateGroupForm />)
    await userEvent.type(name(), 'Dividendos LatAm')
    await userEvent.click(screen.getByRole('button', { name: 'Change banner' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Upload image' }))
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['x'], 'b.png', { type: 'image/png' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Apply crop' }))
    await userEvent.click(create())
    await waitFor(() => expect(router.push).toHaveBeenCalled())
    const sent = deps.uploadGroupImage.mock.calls[0]?.[0] as FormData
    expect(Object.fromEntries([...sent.entries()].filter(([key]) => key !== 'file'))).toEqual({
      communityId: 'g1',
      slug: 'dividendos-latam',
      kind: 'banner',
    })
  })

  it('marks a taken handle and puts the focus there (CG-11)', async () => {
    deps.createGroup.mockResolvedValue({
      ok: false,
      error: 'createGroup.errors.slugTaken',
      fieldErrors: { slug: ['createGroup.errors.slugTaken'] },
    })
    renderWithIntl(<CreateGroupForm />)
    await userEvent.type(name(), 'Dividendos LatAm')
    await userEvent.click(create())
    expect(await screen.findByText('Already taken')).toBeInTheDocument()
    expect(handle()).toHaveFocus()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('opens the account window without a session, and keeps what was written on a failure (CG-11)', async () => {
    deps.createGroup.mockResolvedValue({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
    renderWithIntl(<CreateGroupForm />)
    await userEvent.type(name(), 'Dividendos LatAm')
    await userEvent.click(create())
    await waitFor(() => expect(deps.openGate).toHaveBeenCalled())

    deps.createGroup.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    await userEvent.click(create())
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be created')
    expect(name()).toHaveValue('Dividendos LatAm')
  })

  it('goes to the group already made even if an image failed, and says which (CG-11)', async () => {
    deps.uploadGroupImage.mockResolvedValue({ ok: false, error: 'createGroup.errors.imageUpload' })
    renderWithIntl(<CreateGroupForm />)
    await userEvent.type(name(), 'Dividendos LatAm')
    await userEvent.click(screen.getByRole('button', { name: 'Change photo' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Upload image' }))
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['x'], 'a.png', { type: 'image/png' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Apply crop' }))
    await userEvent.click(create())
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/hub/dividendos-latam'))
    expect(deps.notify).toHaveBeenCalledWith({
      message: 'The group was created, but its photo could not be saved.',
      kind: 'error',
    })
  })

  it('asks before leaving with something written (CG-12)', async () => {
    renderWithIntl(<CreateGroupForm />)
    const leave = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(leave()).toBe(false)
    await userEvent.type(name(), 'x')
    expect(leave()).toBe(true)
  })

  it('shows where the group will live, and offers others when the handle is taken (CG-19)', async () => {
    deps.checkGroupSlug.mockResolvedValue('taken')
    renderWithIntl(<CreateGroupForm />)
    await userEvent.type(name(), 'DeFi')
    expect(screen.getByText('Its address: /hub/defi')).toBeInTheDocument()
    expect(await screen.findByText('Already taken')).toBeInTheDocument()
    deps.checkGroupSlug.mockResolvedValue('free')
    await userEvent.click(screen.getByRole('button', { name: '#defi-2' }))
    expect(handle()).toHaveValue('defi-2')
    expect(await screen.findByText('#defi-2 is available')).toBeInTheDocument()
    // Chosen, the handle no longer follows the name.
    await userEvent.type(name(), ' Latam')
    expect(handle()).toHaveValue('defi-2')
  })

  it('shows the groups that already have a name like it (CG-22)', async () => {
    deps.findSimilarGroups.mockResolvedValue([
      { handle: '#defi', name: 'DeFi', memberCount: 12880, path: '/hub/defi' },
    ])
    renderWithIntl(<CreateGroupForm />)
    await userEvent.type(name(), 'DeFi')
    const similar = await screen.findByRole('region', { name: 'Similar groups already exist' })
    expect(similar).toHaveTextContent('#defi')
    expect(similar).toHaveTextContent('12,880 members')
    expect(screen.getByRole('link', { name: /#defi/ })).toHaveAttribute('href', '/hub/defi')
  })

  it('keeps the actions in a bar that sticks over the phones bottom bar (CG-20)', () => {
    renderWithIntl(<CreateGroupForm />)
    expect(create().closest('[data-sticky-actions]')).not.toBeNull()
  })

  it('shows the rules and the website in the preview, the website only when valid (CG-08)', async () => {
    renderWithIntl(<CreateGroupForm />)
    const preview = screen.getByRole('region', { name: 'Preview' })
    await userEvent.type(screen.getByRole('textbox', { name: /Rules/ }), 'No spam.')
    expect(preview).toHaveTextContent('No spam.')
    const website = screen.getByRole('textbox', { name: /Website/ })
    await userEvent.type(website, 'not a link')
    await userEvent.tab()
    expect(preview).not.toHaveTextContent('not a link')
    await userEvent.clear(website)
    await userEvent.type(website, 'https://www.example.com/about')
    expect(preview).toHaveTextContent('example.com')
  })
})
