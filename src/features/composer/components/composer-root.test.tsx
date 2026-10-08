import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { ComposeSlot, ComposeTrigger } from '@/components/organisms/compose'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComposeScope } from './compose-scope'
import { ComposerRoot } from './composer-root'

const actions = vi.hoisted(() => ({ createPost: vi.fn(), searchCommunities: vi.fn() }))
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
      <ComposeTrigger>Create</ComposeTrigger>
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
// The first import of a deferred part is slow in jsdom.
const SLOW = { timeout: 10_000 }

describe('ComposerRoot in desktop: the box expands in place, as X (PC-01, PC-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    asDesktop(true)
  })
  afterEach(() => vi.restoreAllMocks())

  it('expands the box, hiding its prompt, with the focus in the form', async () => {
    renderRoot()
    await userEvent.click(screen.getByRole('button', { name: 'What are you thinking?' }))
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
    await userEvent.click(create())
    const editor = await screen.findByRole('region', { name: 'Create post' }, SLOW)
    expect(within(editor).getByRole('combobox', { name: 'Community' })).toHaveTextContent('#defi')
    await waitFor(() =>
      expect(within(editor).getByRole('textbox', { name: 'Title' })).toHaveFocus(),
    )
  })

  it('closes with Cancel back to the prompt, and asks first if something is written', async () => {
    renderRoot()
    await userEvent.click(create())
    const editor = await screen.findByRole('region', { name: 'Create post' }, SLOW)
    await userEvent.click(within(editor).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('region', { name: 'Create post' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'What are you thinking?' })).toBeVisible()

    await userEvent.click(create())
    await userEvent.type(await screen.findByRole('textbox', { name: 'Title' }), 'Half a thought')
    await userEvent.keyboard('{Escape}')
    const confirm = await screen.findByRole('alertdialog', { name: 'Discard this post?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Half a thought')

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Discard' }),
    )
    expect(screen.queryByRole('region', { name: 'Create post' })).not.toBeInTheDocument()
  })

  it('brings the box into view from "+ Create" (PC-01)', async () => {
    renderRoot()
    await userEvent.click(create())
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
  })

  it('keeps what is written when Create is pressed again', async () => {
    renderRoot()
    await userEvent.click(create())
    await userEvent.type(await screen.findByRole('textbox', { name: 'Title' }, SLOW), 'Kept')
    await userEvent.click(create())
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Kept')
  })

  it('goes to the Home from a page without a box, and opens there (PC-01)', async () => {
    function Navigating() {
      const [home, setHome] = useState(false)
      router.push.mockImplementation(() => setHome(true))
      return <Page box={home} scope={false} />
    }
    renderWithIntl(
      <AuthGateProvider signedIn>
        <ComposerRoot>
          <Navigating />
        </ComposerRoot>
      </AuthGateProvider>,
    )
    await userEvent.click(create())
    expect(router.push).toHaveBeenCalledWith('/')
    expect(await screen.findByRole('region', { name: 'Create post' }, SLOW)).toBeInTheDocument()
    router.push.mockReset()
  })

  it("closes and opens the new post's page once published (PC-10)", async () => {
    actions.createPost.mockResolvedValue({ ok: true, data: { id: 'abc', title: 'Hello world' } })
    renderRoot({ scope: true })
    await userEvent.click(create())
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
