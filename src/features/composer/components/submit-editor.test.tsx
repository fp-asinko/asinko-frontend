import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityOption } from '../composer.types'
import { draftKey } from '../lib/draft-key'
import { clearDraft, forgetOpenedDraft, writeDraft } from '../hooks/use-post-draft'
import { SubmitEditor } from './submit-editor'

const actions = vi.hoisted(() => ({ createPost: vi.fn(), searchCommunities: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('@/lib/mentions/search-mentions.action', () => ({ searchMentions: vi.fn() }))
vi.mock('@/components/molecules/mention-assist', () => ({ MentionField: () => null }))
vi.mock('../actions/create-post.action', () => ({ createPost: actions.createPost }))
vi.mock('../actions/drafts.action', () => ({
  saveDraft: vi.fn(),
  listDrafts: vi.fn(),
  deleteDraft: vi.fn(),
}))
vi.mock('../actions/upload-post-image.action', () => ({ uploadPostImageAction: vi.fn() }))
vi.mock('../actions/create-thesis.action', () => ({ createThesis: vi.fn() }))
vi.mock('../actions/asset-quote.action', () => ({
  getAssetQuote: vi.fn().mockResolvedValue(null),
}))
vi.mock('../actions/search-communities.action', () => ({
  searchCommunities: actions.searchCommunities,
}))

const KEY = draftKey('u1')
const DEFI: CommunityOption = { id: 'c1', slug: 'defi', handle: '#defi', name: 'DeFi', own: false }
const BTC: CommunityOption = { id: 'c2', slug: 'BTC', handle: '$BTC', name: 'Bitcoin', own: false }
const title = () => screen.getByRole('textbox', { name: 'Title' })

describe('SubmitEditor (specs/submit-page SU-03 to SU-05, SU-12, SU-13)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    actions.searchCommunities.mockResolvedValue({ ok: true, data: [DEFI, BTC] })
  })
  afterEach(() => {
    clearDraft(KEY)
    forgetOpenedDraft(KEY)
  })

  it('swaps to the thesis editor and back from the tabs, losing nothing (specs/thesis-create TC-01)', async () => {
    renderWithIntl(<SubmitEditor type="TEXT" community={DEFI} storageKey={KEY} />)
    await userEvent.type(title(), 'Keep me')
    await userEvent.click(screen.getByRole('tab', { name: 'Thesis' }))
    // The thesis starts clean: the post's group stays with the post (SU-13).
    expect(router.replace).toHaveBeenLastCalledWith('/submit?type=thesis', { scroll: false })
    await vi.waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Thesis', selected: true })).toBeInTheDocument(),
    )
    // The focus goes with the swap (WCAG 2.4.3): loaded now, to where a thesis starts.
    await vi.waitFor(() => expect(screen.getByRole('combobox', { name: /Asset$/ })).toHaveFocus())
    // The post's editor stays, hidden.
    expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull()

    await userEvent.click(screen.getByRole('tab', { name: 'Link' }))
    expect(router.replace).toHaveBeenLastCalledWith('/submit?community=defi&type=link', {
      scroll: false,
    })
    expect(title()).toHaveValue('Keep me')
    // On the format chosen there, with the focus on it.
    const link = screen.getByRole('tab', { name: 'Link', selected: true })
    await vi.waitFor(() => expect(link).toHaveFocus())
    expect(screen.getByRole('textbox', { name: 'Link' })).toBeVisible()

    // Already there, the thesis editor takes the focus on its tab.
    await userEvent.click(link)
    await userEvent.click(screen.getAllByRole('tab', { name: 'Thesis' })[0]!)
    await vi.waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Thesis', selected: true })).toHaveFocus(),
    )
  })

  it('keeps each tab its own place: the post its community and related ones, the thesis its own (SU-13)', async () => {
    renderWithIntl(
      <SubmitEditor type="TEXT" community={DEFI} storageKey={KEY} related={['$BTC']} />,
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Thesis' }))
    expect(router.replace).toHaveBeenLastCalledWith('/submit?type=thesis', { scroll: false })
    await vi.waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Publishing in' })).toHaveTextContent(
        'Choose a community',
      ),
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Text' }))
    expect(router.replace).toHaveBeenLastCalledWith('/submit?community=defi&related=BTC', {
      scroll: false,
    })
    expect(screen.getByRole('combobox', { name: 'Publishing in' })).toHaveTextContent('#defi')
    expect(screen.getByRole('list', { name: 'Related' })).toHaveTextContent('$BTC')
  })

  it('takes an asset of the URL to the thesis as its asset (specs/thesis-create TC-02)', async () => {
    renderWithIntl(<SubmitEditor type="TEXT" community={BTC} storageKey={KEY} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Thesis' }))
    expect(router.replace).toHaveBeenLastCalledWith('/submit?community=BTC&type=thesis', {
      scroll: false,
    })
    await vi.waitFor(() =>
      expect(screen.getByRole('group', { name: /Asset$/ })).toHaveTextContent('$BTC'),
    )
  })

  it('opens on the thesis editor from the URL', async () => {
    renderWithIntl(<SubmitEditor type="THESIS" community={DEFI} storageKey={KEY} />)
    await vi.waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Thesis', selected: true })).toBeInTheDocument(),
    )
    expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull()
  })

  it('follows another community in the URL, keeping what is written', async () => {
    renderWithIntl(<SubmitEditor type="TEXT" community={DEFI} storageKey={KEY} />, {
      locale: 'es',
    })
    await userEvent.type(screen.getByRole('textbox', { name: 'Título' }), 'Keep me')
    await userEvent.click(screen.getByRole('combobox', { name: 'Se publica en' }))
    await userEvent.click(await screen.findByRole('option', { name: /\$BTC/ }))
    expect(router.replace).toHaveBeenCalledWith('/publicar?community=BTC', { scroll: false })
    expect(screen.getByRole('textbox', { name: 'Título' })).toHaveValue('Keep me')
  })

  it('carries the related ones in the URL with the community, each keeping the other (specs/related-aside RA-04)', async () => {
    const MACRO: CommunityOption = {
      id: 'c3',
      slug: 'macro',
      handle: '#macro',
      name: 'Macro',
      own: false,
    }
    actions.searchCommunities.mockResolvedValue({ ok: true, data: [DEFI, BTC, MACRO] })
    renderWithIntl(
      <SubmitEditor type="TEXT" community={DEFI} storageKey={KEY} related={['$BTC']} />,
    )
    // From the URL, as pills.
    expect(screen.getByRole('list', { name: 'Related' })).toHaveTextContent('$BTC')

    screen.getByRole('combobox', { name: 'Add a related community or asset' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: /#macro/ }))
    expect(router.replace).toHaveBeenLastCalledWith('/submit?community=defi&related=BTC%2Cmacro', {
      scroll: false,
    })

    screen.getByRole('combobox', { name: 'Publishing in' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: /#macro/ }))
    // The new main one stops being related; the other stays.
    expect(router.replace).toHaveBeenLastCalledWith('/submit?community=macro&related=BTC', {
      scroll: false,
    })
  })

  it('offers a draft from before: Recover fills the form and its community', async () => {
    writeDraft(KEY, {
      community: BTC,
      type: 'TEXT',
      title: 'From yesterday',
      body: 'Half a thought',
      url: '',
      savedAt: Date.now() - 60_000,
    })
    renderWithIntl(<SubmitEditor type="TEXT" community={null} storageKey={KEY} />)
    const notice = await screen.findByRole('status', { name: '' })
    expect(notice).toHaveTextContent('You have an unpublished draft from 1 minute ago.')
    await userEvent.click(screen.getByRole('button', { name: 'Recover' }))
    expect(title()).toHaveValue('From yesterday')
    // The notice goes with the button: the focus goes to the title (WCAG 2.4.3).
    expect(title()).toHaveFocus()
    expect(screen.getByRole('combobox', { name: 'Publishing in' })).toHaveTextContent('$BTC')
    expect(router.replace).toHaveBeenCalledWith('/submit?community=BTC', { scroll: false })
    expect(screen.queryByRole('button', { name: 'Recover' })).toBeNull()
  })

  it('discards a draft from before when asked, and asks before discarding what is written', async () => {
    writeDraft(KEY, {
      community: null,
      type: 'TEXT',
      title: 'Old',
      body: '',
      url: '',
      savedAt: Date.now(),
    })
    renderWithIntl(<SubmitEditor type="TEXT" community={DEFI} storageKey={KEY} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }))
    expect(localStorage.getItem(KEY)).toBeNull()

    await userEvent.type(title(), 'New')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Discard', hidden: false }))
    // Opened directly (one page in the history): out to the Home.
    expect(router.push).toHaveBeenCalledWith('/')
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('never writes back a draft discarded before its pending save (a bug)', async () => {
    renderWithIntl(<SubmitEditor type="TEXT" community={DEFI} storageKey={KEY} />)
    await userEvent.type(title(), 'Gone')
    // Right away, before the save that waits for the typing to rest.
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Discard', hidden: false }))
    // Past that wait: still nothing (the page here does not leave: router.push is a mock).
    await new Promise((done) => setTimeout(done, 1200))
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('keeps what is written as the draft a moment after the typing rests', async () => {
    renderWithIntl(<SubmitEditor type="TEXT" community={DEFI} storageKey={KEY} />)
    await userEvent.type(title(), 'Saved')
    await vi.waitFor(() =>
      expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toMatchObject({
        title: 'Saved',
        community: { slug: 'defi' },
      }),
    )
  })
})
