// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { shareTargetUrl } from './share-targets'

const URL_ = 'https://asinko.com/en/post/1/fed-cuts'
const TITLE = 'Fed cuts & BTC: what now?'

describe('shareTargetUrl (specs/share-menu SM-03)', () => {
  it("builds each network's share page with the link and the title, encoded", () => {
    expect(shareTargetUrl('x', URL_, TITLE)).toBe(
      'https://x.com/intent/post?url=https%3A%2F%2Fasinko.com%2Fen%2Fpost%2F1%2Ffed-cuts&text=Fed%20cuts%20%26%20BTC%3A%20what%20now%3F',
    )
    expect(shareTargetUrl('telegram', URL_, TITLE)).toBe(
      'https://t.me/share/url?url=https%3A%2F%2Fasinko.com%2Fen%2Fpost%2F1%2Ffed-cuts&text=Fed%20cuts%20%26%20BTC%3A%20what%20now%3F',
    )
    expect(shareTargetUrl('email', URL_, TITLE)).toBe(
      'mailto:?subject=Fed%20cuts%20%26%20BTC%3A%20what%20now%3F&body=https%3A%2F%2Fasinko.com%2Fen%2Fpost%2F1%2Ffed-cuts',
    )
  })

  it('sends WhatsApp one text: the title, then the link', () => {
    const url = new URL(shareTargetUrl('whatsapp', URL_, TITLE))
    expect(url.origin).toBe('https://wa.me')
    expect(url.searchParams.get('text')).toBe(`${TITLE} ${URL_}`)
  })
})
