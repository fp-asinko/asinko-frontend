import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ScrollToTop } from './scroll-to-top'

describe('ScrollToTop', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.history.replaceState(null, '', '/')
  })

  it("starts a post's page at its top", () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<ScrollToTop id="a" />)
    expect(scroll).toHaveBeenCalledWith(0, 0)
  })

  it('leaves a link to a comment where it points', () => {
    window.history.replaceState(null, '', '/post/a#comment-1')
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<ScrollToTop id="a" />)
    expect(scroll).not.toHaveBeenCalled()
  })

  it('keeps the place on going back', () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    window.dispatchEvent(new PopStateEvent('popstate'))
    render(<ScrollToTop id="a" />)
    expect(scroll).not.toHaveBeenCalled()
  })
})
