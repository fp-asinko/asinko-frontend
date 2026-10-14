import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ShareButton } from './share-button'

function pointer(coarse: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({ matches: coarse && query === '(pointer: coarse)', addEventListener() {} }) as never,
  )
}

describe('ShareButton (specs/comment-threads CT-11)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('copies the link to a post with the page locale, says so and goes back after 2s', async () => {
    pointer(false)
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    renderWithIntl(<ShareButton href="/post/1/hello">Share</ShareButton>)
    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(writeText).toHaveBeenCalledWith(`${location.origin}/en/post/1/hello`)
    expect(screen.getByRole('button', { name: 'Link copied' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Link copied')

    expect(
      await screen.findByRole('button', { name: 'Share' }, { timeout: 3000 }),
    ).toBeInTheDocument()
  })

  it("links a comment of this page by its fragment, without the page's query", async () => {
    pointer(false)
    window.history.replaceState(null, '', '/en/post/1/hello?sort=new')
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    renderWithIntl(<ShareButton href="#comment-7">Share</ShareButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(writeText).toHaveBeenCalledWith(`${location.origin}/en/post/1/hello#comment-7`)
  })

  it('says when the clipboard refuses', async () => {
    pointer(false)
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    renderWithIntl(<ShareButton href="/post/1/hello">Share</ShareButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(screen.getByRole('status')).toHaveTextContent('Could not copy')
  })

  it("opens the system's share sheet in a phone", async () => {
    pointer(true)
    const share = vi.fn().mockRejectedValue(new Error('closed'))
    vi.stubGlobal('navigator', { ...navigator, share })
    renderWithIntl(<ShareButton href="/post/1/hello">Share</ShareButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(share).toHaveBeenCalledWith({ url: `${location.origin}/en/post/1/hello` })
    // Closing the sheet says nothing.
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})

describe('ShareButton with a post (specs/share-menu SM-01 to SM-05)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const POST = { title: 'The Fed cuts', preview: '/post/1/opengraph-image/card' }

  it('opens the share window with the image, Copy link focused, and the networks', async () => {
    pointer(false)
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    renderWithIntl(
      <ShareButton href="/post/1/hello" post={POST}>
        Share
      </ShareButton>,
    )
    const button = screen.getByRole('button', { name: 'Share' })
    expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    await user.click(button)
    const dialog = await screen.findByRole('dialog', { name: 'Share post' }, { timeout: 3000 })
    // The image other apps will show, named by the post (SM-02).
    expect(within(dialog).getByRole('img', { name: 'The Fed cuts' })).toHaveAttribute(
      'src',
      expect.stringContaining('/en/post/1/opengraph-image/card'),
    )
    const copy = within(dialog).getByRole('button', { name: 'Copy link' })
    await vi.waitFor(() => expect(copy).toHaveFocus())
    // Nothing copied until asked: the window is where to choose.
    expect(writeText).not.toHaveBeenCalled()

    const link = `${location.origin}/en/post/1/hello`
    const x = within(dialog).getByRole('link', { name: 'X (opens in a new tab)' })
    expect(x).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(link)))
    expect(x).toHaveAttribute('target', '_blank')
    expect(x).toHaveAttribute('rel', 'noopener noreferrer')
    expect(
      within(dialog).getByRole('link', { name: 'WhatsApp (opens in a new tab)' }),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole('link', { name: 'Telegram (opens in a new tab)' }),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^mailto:/),
    )

    await user.click(copy)
    expect(writeText).toHaveBeenCalledWith(link)
    expect(within(dialog).getByRole('button', { name: 'Link copied' })).toBeInTheDocument()
    expect(within(dialog).getByRole('status')).toHaveTextContent('Link copied')
  })

  it('gives the focus back to Share on closing (SM-05)', async () => {
    pointer(false)
    const user = userEvent.setup()
    renderWithIntl(
      <ShareButton href="/post/1/hello" post={POST}>
        Share
      </ShareButton>,
    )
    const button = screen.getByRole('button', { name: 'Share' })
    await user.click(button)
    await screen.findByRole('dialog', { name: 'Share post' }, { timeout: 3000 })
    await user.keyboard('{Escape}')
    await vi.waitFor(() => expect(button).toHaveFocus())
  })

  it("still opens the system's sheet in a phone", async () => {
    pointer(true)
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share })
    renderWithIntl(
      <ShareButton href="/post/1/hello" post={POST}>
        Share
      </ShareButton>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(share).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
