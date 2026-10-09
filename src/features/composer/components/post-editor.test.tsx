import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityOption } from '../composer.types'
import { PostEditor } from './post-editor'

const actions = vi.hoisted(() => ({
  createPost: vi.fn(),
  searchCommunities: vi.fn(),
  uploadPostImageAction: vi.fn(),
  removePostImageAction: vi.fn(),
  prepareImage: vi.fn(),
}))
// Mentions have their own tests (specs/mention-autocomplete): out of this component's.
vi.mock('@/lib/mentions/search-mentions.action', () => ({ searchMentions: vi.fn() }))
vi.mock('@/components/molecules/mention-assist', () => ({ MentionField: () => null }))
vi.mock('../actions/create-post.action', () => ({ createPost: actions.createPost }))
vi.mock('../actions/upload-post-image.action', () => ({
  uploadPostImageAction: actions.uploadPostImageAction,
  removePostImageAction: actions.removePostImageAction,
}))
// Preparing the image has its own tests (prepare-image): here it answers a ready WebP.
vi.mock('@/lib/prepare-image', async (original) => ({
  ...(await original<typeof import('@/lib/prepare-image')>()),
  prepareImage: actions.prepareImage,
}))
vi.mock('../actions/search-communities.action', () => ({
  searchCommunities: actions.searchCommunities,
}))

const DEFI: CommunityOption = {
  id: '00000000-0000-4000-8000-000000001001',
  handle: '#defi',
  name: 'DeFi',
  own: false,
}

function renderEditor({
  community = DEFI as CommunityOption | null,
  type = 'TEXT' as 'TEXT' | 'LINK',
  signedIn = true,
} = {}) {
  const onPublished = vi.fn()
  const onCancel = vi.fn()
  const draftRef: { current: (() => boolean) | null } = { current: null }
  const { unmount } = renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <PostEditor
        variant="inline"
        type={type}
        community={community}
        draftRef={draftRef}
        onCancel={onCancel}
        onPublished={onPublished}
      />
    </AuthGateProvider>,
  )
  return { onPublished, draftRef, onCancel, unmount }
}

const title = () => screen.getByRole('textbox', { name: 'Title' })
const body = () => screen.getByRole('textbox', { name: 'Body' })
const publish = () => screen.getByRole('button', { name: 'Publish' })

describe('PostEditor (specs/post-create-detail PC-06 to PC-10)', () => {
  beforeEach(() => vi.clearAllMocks())

  it("comes with the page's community chosen and opens on the asked tab", () => {
    renderEditor({ type: 'LINK' })
    expect(screen.getByRole('combobox', { name: 'Community' })).toHaveTextContent('#defi')
    expect(screen.getByRole('tab', { name: 'Link' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('textbox', { name: 'Link' })).toBeInTheDocument()
  })

  it('puts the emoji in the last field used, the title too (specs/emoji-picker EP-01)', async () => {
    renderEditor()
    const title = screen.getByRole('textbox', { name: 'Title' })
    await userEvent.type(title, 'Moon')
    await userEvent.click(screen.getByRole('button', { name: 'Add emoji' }))
    const panel = await screen.findByRole('dialog', { name: 'Emojis' })
    await userEvent.click(within(panel).getByRole('button', { name: /^rocket/ }))
    expect(title).toHaveValue('Moon🚀')
    expect(screen.getByRole('textbox', { name: 'Body' })).toHaveValue('')
  })

  it('offers emojis for the body (specs/emoji-picker EP-01)', () => {
    renderEditor()
    expect(screen.getByRole('button', { name: 'Add emoji' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    )
  })

  it('shows Text, Link and Image (specs/post-image PI-01), keeping the text between them', async () => {
    renderEditor()
    expect(screen.queryByRole('textbox', { name: 'Link' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Image' })).not.toHaveAttribute('aria-disabled', 'true')
    await userEvent.type(title(), 'Kept between tabs')
    await userEvent.click(screen.getByRole('tab', { name: 'Link' }))
    expect(screen.getByRole('textbox', { name: 'Link' })).toBeInTheDocument()
    expect(title()).toHaveValue('Kept between tabs')
  })

  it('waits for every field before publishing, and tells when something is written', async () => {
    const { draftRef } = renderEditor()
    expect(draftRef.current?.()).toBe(false)
    expect(publish()).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(publish())
    expect(actions.createPost).not.toHaveBeenCalled()

    await userEvent.type(title(), 'A title')
    expect(draftRef.current?.()).toBe(true)
    expect(publish()).toHaveAttribute('aria-disabled', 'true')
    await userEvent.type(body(), 'A body')
    expect(publish()).not.toHaveAttribute('aria-disabled')
  })

  it('counts the title near its limit, and explains each field once Publish is pressed', async () => {
    renderEditor({ type: 'LINK' })
    await userEvent.click(title())
    await userEvent.paste('x'.repeat(301))
    expect(screen.getByText('301/300')).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: 'Link' }), 'javascript:alert(1)')
    await userEvent.click(body())
    await userEvent.tab()
    // As X: nothing is flagged while writing; Publish says what is missing.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await userEvent.click(publish())
    expect(await screen.findByText('Keep the title within 300 characters')).toBeInTheDocument()
    expect(
      screen.getByText('Enter a link that starts with http:// or https://'),
    ).toBeInTheDocument()
    expect(screen.getByText('Write something in the body')).toBeInTheDocument()
    expect(title()).toHaveAttribute('aria-invalid', 'true')
    // Then the errors follow the typing.
    await userEvent.type(body(), 'Now there is a body')
    expect(screen.queryByText('Write something in the body')).not.toBeInTheDocument()
  })

  it('says what is missing when Post is pressed too early (WCAG 3.3.1)', async () => {
    renderEditor({ community: null })
    await userEvent.click(publish())
    expect(actions.createPost).not.toHaveBeenCalled()
    // The chip says it too (its placeholder); the error is the alert next to it.
    expect((await screen.findAllByRole('alert')).map((alert) => alert.textContent)).toContain(
      'Choose a community',
    )
    expect(screen.getByText('Add a title')).toBeInTheDocument()
    expect(screen.getByText('Write something in the body')).toBeInTheDocument()
    expect(title()).toHaveAccessibleDescription(/Add a title/)
  })

  it("publishes and hands over the new post's page", async () => {
    actions.createPost.mockResolvedValue({
      ok: true,
      data: { id: 'abc', title: 'Stablecoin yields are back' },
    })
    const { onPublished } = renderEditor()
    await userEvent.type(title(), ' Stablecoin yields are back ')
    await userEvent.type(body(), 'Lending demand.')
    await userEvent.click(publish())
    expect(actions.createPost).toHaveBeenCalledWith({
      communityId: DEFI.id,
      type: 'TEXT',
      title: 'Stablecoin yields are back',
      body: 'Lending demand.',
    })
    expect(onPublished).toHaveBeenCalledWith('/post/abc/stablecoin-yields-are-back')
  })

  it('keeps the text and explains a refusal of the server', async () => {
    actions.createPost.mockResolvedValue({ ok: false, error: 'composer.errors.ownProfileOnly' })
    const { onPublished } = renderEditor()
    await userEvent.type(title(), 'A title')
    await userEvent.type(body(), 'A body')
    await userEvent.click(publish())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You can only post on your own profile',
    )
    expect(title()).toHaveValue('A title')
    expect(body()).toHaveValue('A body')
    expect(onPublished).not.toHaveBeenCalled()
  })

  it('marks the fields the server rejects, and says a general reason for the rest', async () => {
    actions.createPost.mockResolvedValue({
      ok: false,
      error: 'composer.errors.invalid',
      fieldErrors: { body: ['composer.errors.bodyRequired'] },
    })
    renderEditor()
    await userEvent.type(title(), 'A title')
    await userEvent.type(body(), 'A body')
    await userEvent.click(publish())
    expect(await screen.findByText('Write something in the body')).toBeInTheDocument()
    expect(screen.getByText('Check the fields and try again')).toBeInTheDocument()

    actions.createPost.mockResolvedValue({ ok: false, error: 'api.errors.RATE_LIMITED' })
    await userEvent.click(publish())
    expect(await screen.findByText('Could not publish your post. Try again.')).toBeInTheDocument()
  })

  it('opens the account modal if the session ended meanwhile', async () => {
    actions.createPost.mockResolvedValue({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
    renderEditor({ signedIn: false })
    await userEvent.type(title(), 'A title')
    await userEvent.type(body(), 'A body')
    await userEvent.click(publish())
    expect(await screen.findByRole('dialog', { name: 'Join Asinko to post' })).toBeInTheDocument()
  })
})

describe('PostEditor with an image (specs/post-image)', () => {
  const IMAGE = 'https://project.supabase.co/storage/v1/object/public/post-images/u/a.webp'
  const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!
  const preview = () => screen.findByRole('img', { name: 'The image of your post' })

  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    actions.prepareImage.mockResolvedValue({
      ok: true,
      blob: new Blob(['webp'], { type: 'image/webp' }),
      width: 800,
      height: 600,
    })
    actions.uploadPostImageAction.mockResolvedValue({ ok: true, data: { imageUrl: IMAGE } })
    actions.createPost.mockResolvedValue({ ok: true, data: { id: 'img', title: 'Chart' } })
  })

  const png = () => new File(['png'], 'chart.png', { type: 'image/png' })

  it('uploads the chosen image, waits for it, and publishes it as an Image post (PI-06, PI-10)', async () => {
    let finish!: (value: unknown) => void
    actions.uploadPostImageAction.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { onPublished } = renderEditor()
    await userEvent.click(screen.getByRole('tab', { name: 'Image' }))
    await userEvent.type(title(), 'Chart')
    await userEvent.type(body(), 'Look at this.')
    await userEvent.upload(fileInput(), png())

    expect(await screen.findByRole('status', { name: '' })).toBeInTheDocument()
    expect(screen.getAllByRole('status').some((each) => each.textContent === 'Uploading…')).toBe(
      true,
    )
    expect(publish()).toHaveAttribute('aria-disabled', 'true')
    finish({ ok: true, data: { imageUrl: IMAGE } })
    expect(await preview()).toBeInTheDocument()
    expect(publish()).not.toHaveAttribute('aria-disabled')

    await userEvent.click(publish())
    expect(actions.createPost).toHaveBeenCalledWith({
      communityId: DEFI.id,
      type: 'IMAGE',
      title: 'Chart',
      body: 'Look at this.',
      imageUrl: IMAGE,
    })
    expect(onPublished).toHaveBeenCalledWith('/post/img/chart')
    expect(actions.removePostImageAction).not.toHaveBeenCalled()
  })

  it('takes a pasted image into the Image format (PI-02)', async () => {
    renderEditor()
    await userEvent.click(title())
    await userEvent.paste({ files: [png()] } as unknown as DataTransfer)
    expect(screen.getByRole('tab', { name: 'Image' })).toHaveAttribute('aria-selected', 'true')
    expect(await preview()).toBeInTheDocument()
    expect(actions.uploadPostImageAction).toHaveBeenCalledOnce()
  })

  it('takes an image dropped on the editor into the Image format (PI-02)', async () => {
    renderEditor()
    const data = { files: [png()], types: ['Files'] }
    fireEvent.dragOver(title(), { dataTransfer: data })
    fireEvent.drop(title(), { dataTransfer: data })
    expect(screen.getByRole('tab', { name: 'Image' })).toHaveAttribute('aria-selected', 'true')
    expect(await preview()).toBeInTheDocument()
  })

  it('says why an image is refused (PI-03)', async () => {
    actions.prepareImage.mockResolvedValue({ ok: false, error: 'type' })
    renderEditor()
    await userEvent.click(screen.getByRole('tab', { name: 'Image' }))
    await userEvent.upload(fileInput(), new File(['gif'], 'a.gif', { type: 'image/gif' }), {
      applyAccept: false,
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Only JPEG, PNG or WebP images')
    expect(actions.uploadPostImageAction).not.toHaveBeenCalled()
  })

  it('offers to retry a failed upload', async () => {
    actions.uploadPostImageAction.mockResolvedValueOnce({
      ok: false,
      error: 'composer.errors.imageUpload',
    })
    renderEditor()
    await userEvent.click(screen.getByRole('tab', { name: 'Image' }))
    await userEvent.upload(fileInput(), png())
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not upload the image')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await preview()).toBeInTheDocument()
  })

  it('removes the image, deleting it from the bucket, and focuses where to choose another (Q1)', async () => {
    renderEditor()
    await userEvent.click(screen.getByRole('tab', { name: 'Image' }))
    await userEvent.upload(fileInput(), png())
    await userEvent.click(await screen.findByRole('button', { name: 'Remove image' }))
    expect(actions.removePostImageAction).toHaveBeenCalledWith({ imageUrl: IMAGE })
    expect(screen.getByRole('button', { name: /Choose image/ })).toHaveFocus()
  })

  it('counts an image as something written, and deletes it if the editor closes unpublished', async () => {
    const view = renderEditor()
    await userEvent.click(screen.getByRole('tab', { name: 'Image' }))
    await userEvent.upload(fileInput(), png())
    await preview()
    expect(view.draftRef.current?.()).toBe(true)
    view.unmount()
    expect(actions.removePostImageAction).toHaveBeenCalledWith({ imageUrl: IMAGE })
  })
})
