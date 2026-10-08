import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { ComposeSlot, ComposeTrigger } from '@/components/organisms/compose'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComposeScope } from './compose-scope'
import { ComposerRoot } from './composer-root'

const actions = vi.hoisted(() => ({ createPost: vi.fn(), searchCommunities: vi.fn() }))
// Mentions have their own tests (specs/mention-autocomplete): out of this component's.
vi.mock('@/lib/mentions/search-mentions.action', () => ({ searchMentions: vi.fn() }))
vi.mock('@/components/molecules/mention-assist', () => ({ MentionField: () => null }))
vi.mock('../actions/create-post.action', () => ({ createPost: actions.createPost }))
vi.mock('../actions/search-communities.action', () => ({
  searchCommunities: actions.searchCommunities,
}))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const DEFI = { id: '00000000-0000-4000-8000-000000001001', handle: '#defi', name: 'DeFi' }

// jsdom does not scroll: a double that says where the page went.
const scrollIntoView = vi.fn()
Element.prototype.scrollIntoView = scrollIntoView

/** md and up: the editor expands in the page's box. */
function asDesktop(desktop: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) => ({ matches: desktop, media: query }) as MediaQueryList,
  )
}

/** A page with the composer box (Home, a group) or without it (a post's page). */
function Page({ box, scope }: { box: boolean; scope: boolean }) {
  return (
    <>
      {scope && <ComposeScope {...DEFI} />}
      {box && (
        <ComposeSlot
          avatar={<span>avatar</span>}
          prompt={<ComposeTrigger>What are you thinking?</ComposeTrigger>}
          actions={<ComposeTrigger type="TEXT">Post</ComposeTrigger>}
        />
      )}
      {/* "+ Create" in the top bar: a window over the page, as X. */}
      <ComposeTrigger view="modal">Create</ComposeTrigger>
    </>
  )
}

function renderRoot({ signedIn = true, scope = false, box = true } = {}) {
  return renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <ComposerRoot>
        <Page box={box} scope={scope} />
      </ComposerRoot>
    </AuthGateProvider>,
  )
}

const create = () => screen.getByRole('button', { name: 'Create' })
const prompt = () => screen.getByRole('button', { name: 'What are you thinking?' })
// The first import of a deferred part is slow in jsdom.
const SLOW = { timeout: 10_000 }

describe('ComposerRoot in desktop: the box expands in place, as X (PC-01, PC-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    asDesktop(true)
  })
  afterEach(() => vi.restoreAllMocks())

  it('expands the box, hiding its prompt only once the editor is there, with the focus in the form', async () => {
    renderRoot()
    await userEvent.click(screen.getByRole('button', { name: 'What are you thinking?' }))
    // Still downloading the first time: the box keeps its prompt, never empty.
    if (!screen.queryByRole('region', { name: 'Create post' })) {
      expect(screen.getByRole('button', { name: 'What are you thinking?' })).toBeVisible()
    }
    const editor = await screen.findByRole('region', { name: 'Create post' }, SLOW)
    expect(
      screen.getByRole('button', { name: 'What are you thinking?', hidden: true }),
    ).not.toBeVisible()
    expect(within(editor).getByRole('tab', { name: 'Text' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await waitFor(() =>
      expect(within(editor).getByRole('combobox', { name: 'Community' })).toHaveFocus(),
    )
  }, 15_000)

  it("comes with the page's community chosen, and the focus on the title", async () => {
    renderRoot({ scope: true })
    await userEvent.click(prompt())
    const editor = await screen.findByRole('region', { name: 'Create post' }, SLOW)
    expect(within(editor).getByRole('combobox', { name: 'Community' })).toHaveTextContent('#defi')
    await waitFor(() =>
      expect(within(editor).getByRole('textbox', { name: 'Title' })).toHaveFocus(),
    )
  })

  it('folds back to the prompt with Cancel, and asks first if something is written', async () => {
    renderRoot()
    await userEvent.click(prompt())
    const editor = await screen.findByRole('region', { name: 'Create post' }, SLOW)
    await userEvent.click(within(editor).getByRole('button', { name: 'Cancel' }))
    // It folds to the closed box's height before giving it its place.
    expect(editor.style.height).toBe('2.6875rem')
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Create post' })).not.toBeInTheDocument(),
    )
    expect(prompt()).toBeVisible()

    await userEvent.click(prompt())
    await userEvent.type(await screen.findByRole('textbox', { name: 'Title' }), 'Half a thought')
    await userEvent.keyboard('{Escape}')
    const confirm = await screen.findByRole('alertdialog', { name: 'Discard this post?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Half a thought')

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Discard' }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Create post' })).not.toBeInTheDocument(),
    )
  })

  it('opens "+ Create" in a window over the page, as X, without moving it (PC-01)', async () => {
    renderRoot({ scope: true })
    await userEvent.click(create())
    const window = await screen.findByRole('dialog', { name: 'Create post' }, SLOW)
    expect(screen.queryByRole('region', { name: 'Create post' })).not.toBeInTheDocument()
    expect(scrollIntoView).not.toHaveBeenCalled()
    // The page's community comes chosen there too.
    expect(within(window).getByRole('combobox', { name: 'Community' })).toHaveTextContent('#defi')
  })

  it('opens the window too on a page without a box (PC-01)', async () => {
    renderRoot({ box: false })
    await userEvent.click(create())
    expect(await screen.findByRole('dialog', { name: 'Create post' }, SLOW)).toBeInTheDocument()
  })

  it('keeps what is written when the box is touched again', async () => {
    renderRoot()
    await userEvent.click(prompt())
    await userEvent.type(await screen.findByRole('textbox', { name: 'Title' }, SLOW), 'Kept')
    await userEvent.click(screen.getByRole('button', { name: 'Post', hidden: true }))
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Kept')
  })

  it("closes and opens the new post's page once published (PC-10)", async () => {
    actions.createPost.mockResolvedValue({ ok: true, data: { id: 'abc', title: 'Hello world' } })
    renderRoot({ scope: true })
    await userEvent.click(prompt())
    await userEvent.type(await screen.findByRole('textbox', { name: 'Title' }, SLOW), 'Hello world')
    await userEvent.type(screen.getByRole('textbox', { name: 'Body' }), 'Body')
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    expect(router.push).toHaveBeenCalledWith('/post/abc/hello-world')
    expect(screen.queryByRole('region', { name: 'Create post' })).not.toBeInTheDocument()
  })
})

describe('ComposerRoot in mobile: full screen (PC-02, PC-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    asDesktop(false)
  })
  afterEach(() => vi.restoreAllMocks())

  it('opens the whole screen, also from the box, and closes with Cancel', async () => {
    renderRoot()
    await userEvent.click(screen.getByRole('button', { name: 'What are you thinking?' }))
    const sheet = await screen.findByRole('dialog', { name: 'Create post' }, SLOW)
    expect(screen.queryByRole('region', { name: 'Create post' })).not.toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('button', { name: 'Cancel' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Create post' })).not.toBeInTheDocument(),
    )
  }, 15_000)

  it('asks before discarding what was written', async () => {
    renderRoot()
    await userEvent.click(create())
    await userEvent.type(await screen.findByRole('textbox', { name: 'Title' }, SLOW), 'Half')
    await userEvent.keyboard('{Escape}')
    expect(
      await screen.findByRole('alertdialog', { name: 'Discard this post?' }),
    ).toBeInTheDocument()
  })
})

describe('ComposerRoot without a session (PC-04)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('opens the account modal instead', async () => {
    asDesktop(true)
    renderRoot({ signedIn: false })
    await userEvent.click(create())
    expect(await screen.findByRole('dialog', { name: 'Join Asinko to post' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Create post' })).not.toBeInTheDocument()
  })
})
