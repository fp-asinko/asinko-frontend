import { screen } from '@testing-library/react'
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
