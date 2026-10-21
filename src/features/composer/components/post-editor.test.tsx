import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityOption, SavedDraft } from '../composer.types'
import { PostEditor } from './post-editor'

const actions = vi.hoisted(() => ({
  createPost: vi.fn(),
  searchCommunities: vi.fn(),
  uploadPostImageAction: vi.fn(),
  prepareImage: vi.fn(),
  saveDraft: vi.fn(),
  listDrafts: vi.fn(),
  deleteDraft: vi.fn(),
}))
vi.mock('../actions/drafts.action', () => ({
  saveDraft: actions.saveDraft,
  listDrafts: actions.listDrafts,
  deleteDraft: actions.deleteDraft,
}))
// Mentions have their own tests (specs/mention-autocomplete): out of this component's.
vi.mock('@/lib/mentions/search-mentions.action', () => ({ searchMentions: vi.fn() }))
vi.mock('@/components/molecules/mention-assist', () => ({ MentionField: () => null }))
vi.mock('../actions/create-post.action', () => ({ createPost: actions.createPost }))
vi.mock('../actions/upload-post-image.action', () => ({
  uploadPostImageAction: actions.uploadPostImageAction,
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
  slug: 'defi',
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
      related: [],
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

    expect((await screen.findAllByText('Uploading…')).length).toBeGreaterThan(0)
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
      related: [],
    })
    expect(onPublished).toHaveBeenCalledWith('/post/img/chart')
  })

  it('publishes the image with its description when there is one (BA-04)', async () => {
    renderEditor()
    await userEvent.click(screen.getByRole('tab', { name: 'Image' }))
    // The description shows once there is an image.
    expect(screen.queryByRole('textbox', { name: 'Image description (optional)' })).toBeNull()
    await userEvent.type(title(), 'Chart')
    await userEvent.type(body(), 'Look at this.')
    await userEvent.upload(fileInput(), png())
    await preview()
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Image description (optional)' }),
      'BTC price since 2020',
    )
    await userEvent.click(publish())
    expect(actions.createPost).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'IMAGE', imageUrl: IMAGE, imageAlt: 'BTC price since 2020' }),
    )
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

  it('removes the image and focuses where to choose another', async () => {
    renderEditor()
    await userEvent.click(screen.getByRole('tab', { name: 'Image' }))
    await userEvent.upload(fileInput(), png())
    await userEvent.click(await screen.findByRole('button', { name: 'Remove image' }))
    expect(screen.getByRole('button', { name: /Choose image/ })).toHaveFocus()
  })

  it('counts an image as something written', async () => {
    const view = renderEditor()
    await userEvent.click(screen.getByRole('tab', { name: 'Image' }))
    await userEvent.upload(fileInput(), png())
    await preview()
    expect(view.draftRef.current?.()).toBe(true)
  })
})

describe('PostEditor related ones (specs/related-tags)', () => {
  beforeEach(() => vi.clearAllMocks())

  const option = (handle: string, id = handle): CommunityOption => ({
    id,
    slug: handle.slice(1),
    handle,
    name: handle,
    own: false,
  })

  async function addRelated(handle: string) {
    screen.getByRole('combobox', { name: 'Add a related community or asset' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: handle }))
  }

  it('offers "+" only with a community, and publishes the related ones apart from the body (RT-01, specs/backend-answer-1020 BA-06)', async () => {
    renderEditor({ community: null })
    expect(screen.queryByRole('combobox', { name: /Add a related/ })).toBeNull()
    actions.searchCommunities.mockResolvedValue({
      ok: true,
      data: [DEFI, option('$GGAL'), option('#macro')],
    })
    screen.getByRole('combobox', { name: 'Community' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: /#defi/ }))

    await addRelated('$GGAL')
    await addRelated('#macro')
    actions.createPost.mockResolvedValue({ ok: true, data: { id: 'abc', title: 'Banks' } })
    await userEvent.type(title(), 'Banks')
    await userEvent.type(body(), 'Cheap.')
    await userEvent.click(publish())
    expect(actions.createPost).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'Cheap.', related: ['$GGAL', '#macro'] }),
    )
  })

  it('a related one chosen as the main community stops being related (RT-05)', async () => {
    actions.searchCommunities.mockResolvedValue({
      ok: true,
      data: [DEFI, option('$GGAL', '00000000-0000-4000-8000-000000009001')],
    })
    renderEditor()
    await addRelated('$GGAL')
    expect(screen.getByRole('list', { name: 'Related' })).toHaveTextContent('$GGAL')

    screen.getByRole('combobox', { name: 'Community' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: '$GGAL' }))
    expect(screen.queryByRole('list', { name: 'Related' })).toBeNull()
  })
})

describe('PostEditor tools (specs/submit-tools)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('previews what is written, with its community, and asks nothing while it is missing (ST-01, ST-03)', async () => {
    const preview = vi.fn(async () => ({ ok: true as const, data: { card: <p>The card</p> } }))
    renderWithIntl(
      <AuthGateProvider signedIn>
        <PostEditor
          type="TEXT"
          community={DEFI}
          draftRef={{ current: null }}
          onCancel={vi.fn()}
          onPublished={vi.fn()}
          preview={preview}
        />
      </AuthGateProvider>,
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    expect(preview).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('tab', { name: 'Write' }))
    await userEvent.type(title(), 'Rates')
    await userEvent.type(body(), 'Up again.')
    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    expect(preview).toHaveBeenCalledWith({
      title: 'Rates',
      body: 'Up again.',
      type: 'TEXT',
      url: undefined,
      imageUrl: undefined,
      imageAlt: undefined,
      community: { slug: 'defi', handle: '#defi', name: 'DeFi', own: false },
      locale: 'en',
    })
    expect(await screen.findByText('The card')).toBeInTheDocument()
  })

  it('formats the body with its toolbar and with Ctrl+B (ST-04, ST-05)', async () => {
    renderEditor()
    await userEvent.type(body(), 'rates')
    ;(body() as HTMLTextAreaElement).setSelectionRange(0, 5)
    await userEvent.keyboard('{Control>}b{/Control}')
    expect(body()).toHaveValue('**rates**')
    await userEvent.click(screen.getByRole('button', { name: 'Quote' }))
    expect(body()).toHaveValue('> **rates**')
  })
})

describe('PostEditor as Reddit (specs/submit-form-layout)', () => {
  it("shows the title's counter always, and says the title is required (SF-03)", async () => {
    renderEditor()
    expect(title()).toHaveAttribute('aria-required', 'true')
    expect(title()).toHaveAccessibleDescription(/0\/300/)
    await userEvent.type(title(), 'Rates')
    expect(title()).toHaveAccessibleDescription(/5\/300/)
  })

  it('puts the formats on top and only Cancel, Save draft and Publish at the bottom (SF-02, SF-06, DT-01)', () => {
    renderEditor()
    const formats = screen.getByRole('tablist', { name: 'Post type' })
    const actions = screen.getByRole('button', { name: 'Publish' }).parentElement!
    expect(formats.compareDocumentPosition(title()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(actions.querySelectorAll('button')).toHaveLength(3)
  })
})

describe('PostEditor tags (specs/drafts-tags DT-07 to DT-09)', () => {
  beforeEach(() => vi.clearAllMocks())

  const TAGGED: CommunityOption = { ...DEFI, tags: ['Analysis', 'News'] }

  it('publishes the chosen tag', async () => {
    actions.createPost.mockResolvedValue({ ok: true, data: { id: 'abc', title: 'Yields' } })
    renderEditor({ community: TAGGED })
    await userEvent.type(title(), 'Yields')
    await userEvent.type(body(), 'Up.')
    await userEvent.click(screen.getByRole('button', { name: 'Add tag' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'News' }))
    await userEvent.click(publish())
    expect(actions.createPost).toHaveBeenCalledWith(expect.objectContaining({ tag: 'News' }))
  })

  it('drops the tag when the new community does not have it', async () => {
    const GGAL: CommunityOption = {
      id: '00000000-0000-4000-8000-000000009001',
      slug: 'GGAL',
      handle: '$GGAL',
      name: 'Galicia',
      own: false,
      tags: [],
    }
    actions.searchCommunities.mockResolvedValue({ ok: true, data: [TAGGED, GGAL] })
    renderEditor({ community: TAGGED })
    await userEvent.click(screen.getByRole('button', { name: 'Add tag' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Analysis' }))
    expect(screen.getByRole('button', { name: 'Remove tag Analysis' })).toBeInTheDocument()

    screen.getByRole('combobox', { name: 'Community' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: /GGAL/ }))
    expect(screen.queryByText('Analysis')).toBeNull()
    expect(screen.getByRole('button', { name: 'Add tag' })).toHaveAccessibleDescription(
      'This community has no tags',
    )
  })
})

describe('PostEditor drafts (specs/drafts-tags DT-01 to DT-05)', () => {
  beforeEach(() => vi.clearAllMocks())

  const DRAFT_ID = '00000000-0000-4000-8000-000000000901'
  const saveDraftButton = () => screen.getByRole('button', { name: /Save draft|Saved/ })
  const SAVED: SavedDraft = {
    id: DRAFT_ID,
    type: 'TEXT',
    title: 'Rates are going down',
    body: 'The Fed cuts.',
    url: '',
    imageUrl: null,
    imageAlt: '',
    tag: 'Analysis',
    community: { ...DEFI, slug: 'macro', handle: '#macro', name: 'Macro', tags: ['Analysis'] },
    related: [],
    updatedAt: new Date().toISOString(),
  }

  async function openDraft() {
    await userEvent.click(screen.getByRole('button', { name: 'Drafts' }))
    await userEvent.click(await screen.findByRole('button', { name: /^Rates are going down/ }))
  }

  it('saves what is written, says so, and saving again updates the same draft', async () => {
    actions.saveDraft.mockResolvedValue({ ok: true, data: { id: DRAFT_ID } })
    renderEditor()
    expect(saveDraftButton()).toHaveAttribute('aria-disabled', 'true')

    await userEvent.type(title(), 'Yields')
    await userEvent.click(saveDraftButton())
    expect(actions.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ communityId: DEFI.id, title: 'Yields' }),
    )
    expect(actions.saveDraft.mock.calls[0]![0]).not.toHaveProperty('draftId')
    expect(await screen.findByRole('status')).toHaveTextContent('Draft saved')
    expect(await screen.findByRole('button', { name: 'Saved' })).toBeInTheDocument()

    // Writing on: no longer what was saved.
    await userEvent.type(body(), 'Up.')
    expect(saveDraftButton()).toHaveTextContent('Save draft')
    expect(screen.getByRole('status')).not.toHaveTextContent('Draft saved')
    await userEvent.click(saveDraftButton())
    expect(actions.saveDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({ draftId: DRAFT_ID, body: 'Up.' }),
    )
  })

  it('says when there are already 20 (DT-05)', async () => {
    actions.saveDraft.mockResolvedValue({ ok: false, error: 'composer.drafts.errors.limit' })
    renderEditor()
    await userEvent.type(title(), 'One more')
    await userEvent.click(saveDraftButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(/You have 20 drafts/)
  })

  it('opens a draft in the form, and publishing it deletes it (DT-03)', async () => {
    actions.listDrafts.mockResolvedValue({ ok: true, data: [SAVED] })
    actions.createPost.mockResolvedValue({ ok: true, data: { id: 'abc', title: 'Rates' } })
    renderEditor()
    await openDraft()

    expect(title()).toHaveValue('Rates are going down')
    expect(body()).toHaveValue('The Fed cuts.')
    expect(screen.getByRole('combobox', { name: 'Community' })).toHaveTextContent('#macro')
    expect(screen.getByRole('button', { name: 'Remove tag Analysis' })).toBeInTheDocument()
    // The focus goes to the form, not back to "Drafts" (WCAG 2.4.3).
    await vi.waitFor(() => expect(title()).toHaveFocus())

    await userEvent.click(publish())
    expect(actions.createPost).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Rates are going down', tag: 'Analysis' }),
      DRAFT_ID,
    )
  })

  it('asks before replacing what is written, and keeps it on Cancel', async () => {
    actions.listDrafts.mockResolvedValue({ ok: true, data: [SAVED] })
    renderEditor()
    await userEvent.type(title(), 'Mine')
    await openDraft()

    const ask = await screen.findByRole('alertdialog', { name: "Replace what you've written?" })
    await userEvent.click(within(ask).getByRole('button', { name: 'Cancel' }))
    // Back to the list, still open over the form: what was written stays.
    expect(screen.getByDisplayValue('Mine')).toBeInTheDocument()

    await userEvent.click(await screen.findByRole('button', { name: /^Rates are going down/ }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Replace' }),
    )
    expect(title()).toHaveValue('Rates are going down')
  })
})
