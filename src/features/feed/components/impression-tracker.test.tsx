import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImpressionTracker, SEEN_MS } from './impression-tracker'

const queue = vi.hoisted(() => ({ trackImpression: vi.fn(), flushImpressions: vi.fn() }))
vi.mock('../lib/impression-queue', () => queue)

const PAGE = '00000000-0000-4000-8000-000000000001'
const POST = '11111111-1111-4111-8111-111111111111'
const POLL = '22222222-2222-4222-8222-222222222222'
const PATH = `/post/${POST}/whales`

/** jsdom has no IntersectionObserver: one the test drives, card by card. */
let fire: (target: Element, ratio: number) => void
const unobserved: Element[] = []
class FakeObserver {
  constructor(callback: IntersectionObserverCallback) {
    fire = (target, ratio) =>
      callback(
        [
          {
            target,
            isIntersecting: ratio > 0,
            intersectionRatio: ratio,
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver,
      )
  }
  observe() {}
  unobserve(target: Element) {
    unobserved.push(target)
  }
  disconnect() {}
}

function feed() {
  return render(
    <ImpressionTracker requestId={PAGE}>
      <ul>
        <li>
          <article data-content-id={POST} data-content-path={PATH} aria-label="post">
            <a href={`/en${PATH}`}>Whales</a>
            <a href="https://example.com/macro">#macro</a>
            <button type="button">Upvote</button>
            <p>Body text</p>
          </article>
        </li>
        <li>
          <article data-content-id={POLL} aria-label="poll">
            <p>A question</p>
          </article>
        </li>
      </ul>
    </ImpressionTracker>,
  )
}

describe('ImpressionTracker (specs/explore-v1 EX-05, EX-06)', () => {
  let now = 0

  beforeEach(() => {
    queue.trackImpression.mockReset()
    queue.flushImpressions.mockReset()
    unobserved.length = 0
    now = 0
    vi.stubGlobal('IntersectionObserver', FakeObserver)
    vi.spyOn(performance, 'now').mockImplementation(() => now)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const post = () => screen.getByRole('article', { name: 'post' })
  const poll = () => screen.getByRole('article', { name: 'poll' })

  it('counts a card seen at half or more for a second, once, with how long', () => {
    feed()
    act(() => fire(post(), 0.6))
    now = SEEN_MS + 250
    act(() => fire(post(), 0.2))
    expect(queue.trackImpression).toHaveBeenCalledWith(PAGE, {
      contentId: POST,
      type: 'SEEN',
      dwellMs: 1250,
    })
    expect(unobserved).toContain(post())

    // Once per page load.
    act(() => fire(post(), 1))
    now += 5000
    act(() => fire(post(), 0))
    expect(queue.trackImpression).toHaveBeenCalledTimes(1)
  })

  it('does not count a glimpse, nor less than half of a card', () => {
    feed()
    act(() => fire(post(), 0.9))
    now = SEEN_MS - 1
    act(() => fire(post(), 0))
    act(() => fire(poll(), 0.4))
    now += 5000
    act(() => fire(poll(), 0))
    expect(queue.trackImpression).not.toHaveBeenCalled()
  })

  it('counts what is on screen when the page is hidden or left, and sends it', () => {
    const { unmount } = feed()
    act(() => fire(poll(), 1))
    now = 2000
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    expect(queue.trackImpression).toHaveBeenCalledWith(PAGE, {
      contentId: POLL,
      type: 'SEEN',
      dwellMs: 2000,
    })
    expect(queue.flushImpressions).toHaveBeenCalled()

    act(() => fire(post(), 1))
    now = 4000
    unmount()
    expect(queue.trackImpression).toHaveBeenLastCalledWith(PAGE, {
      contentId: POST,
      type: 'SEEN',
      dwellMs: 2000,
    })
  })

  it('counts opening the post from its title or the card, once', async () => {
    feed()
    const opened = () =>
      queue.trackImpression.mock.calls.filter(([, event]) => event.type === 'OPEN')
    // A link to the post: its title (the click itself is the browser's).
    const title = screen.getByRole('link', { name: 'Whales' })
    title.addEventListener('click', (event) => event.preventDefault())
    await userEvent.click(title)
    expect(opened()).toEqual([[PAGE, { contentId: POST, type: 'OPEN' }]])

    await userEvent.click(screen.getByText('Body text'))
    expect(opened()).toHaveLength(1)
  })

  it('opens from the card itself, as CardLink does', async () => {
    feed()
    await userEvent.click(screen.getByText('Body text'))
    expect(queue.trackImpression).toHaveBeenCalledWith(PAGE, { contentId: POST, type: 'OPEN' })
  })

  it('is not opening to vote, follow another link, or touch a poll', async () => {
    feed()
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    const mention = screen.getByRole('link', { name: '#macro' })
    mention.addEventListener('click', (event) => event.preventDefault())
    await userEvent.click(mention)
    await userEvent.click(screen.getByText('A question'))
    expect(queue.trackImpression).not.toHaveBeenCalled()
  })

  it('counts again a card still on screen when the page shows again after a glimpse', () => {
    const visibility = (value: 'hidden' | 'visible') => {
      Object.defineProperty(document, 'visibilityState', { value, configurable: true })
      act(() => void document.dispatchEvent(new Event('visibilitychange')))
    }
    feed()
    act(() => fire(post(), 1))
    now = 500
    visibility('hidden')
    expect(queue.trackImpression).not.toHaveBeenCalled()
    // Hidden time does not count; shown again, it counts from now.
    now = 10_000
    visibility('visible')
    now = 11_200
    act(() => fire(post(), 0))
    expect(queue.trackImpression).toHaveBeenCalledWith(PAGE, {
      contentId: POST,
      type: 'SEEN',
      dwellMs: 1200,
    })
  })

  it('draws its children as they are, without a box of its own', () => {
    const { container } = feed()
    expect(container.firstElementChild).toHaveClass('contents')
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })
})
