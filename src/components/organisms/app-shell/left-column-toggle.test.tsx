import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { LeftColumnScope, LeftColumnToggle } from './left-column-toggle'

const button = () => screen.getByRole('button', { name: 'Your interests' })
const mark = (container: HTMLElement) => container.querySelector('[data-left-scope]')

function clearCookies() {
  for (const name of ['asinko-left-column', 'asinko-left-column-submit']) {
    document.cookie = `${name}=; path=/; max-age=0`
  }
}

describe('LeftColumnToggle (specs/sidebar-toggle)', () => {
  afterEach(clearCookies)

  it('is a disclosure of the left column, starting as the server read it (SL-03, SL-10)', () => {
    const { unmount } = renderWithIntl(<LeftColumnToggle initialFolded={false} />)
    expect(button()).toHaveAttribute('aria-expanded', 'true')
    expect(button()).toHaveAttribute('aria-controls', 'left-column')
    expect(button()).toHaveAttribute('data-left-site', 'open')
    unmount()

    renderWithIntl(<LeftColumnToggle initialFolded />)
    expect(button()).toHaveAttribute('aria-expanded', 'false')
    expect(button()).toHaveAttribute('data-left-site', 'folded')
  })

  it("folds and opens the site's column, remembering it in a cookie (SL-02, SL-08)", async () => {
    renderWithIntl(<LeftColumnToggle initialFolded={false} />)
    await userEvent.click(button())
    expect(button()).toHaveAttribute('aria-expanded', 'false')
    expect(button()).toHaveAttribute('data-left-site', 'folded')
    expect(document.cookie).toContain('asinko-left-column=folded')

    // With the keyboard too.
    button().focus()
    await userEvent.keyboard('{Enter}')
    expect(button()).toHaveAttribute('aria-expanded', 'true')
    expect(document.cookie).toContain('asinko-left-column=open')
  })

  it("works on the page's own choice while its mark is shown, and leaves the site's alone (SL-09)", async () => {
    const { container, rerender } = renderWithIntl(
      <>
        <LeftColumnToggle initialFolded={false} />
        <LeftColumnScope initialOpen={false} />
      </>,
    )
    // The page to create a post starts folded; the site's stays open.
    expect(button()).toHaveAttribute('aria-expanded', 'false')
    expect(mark(container)).toHaveAttribute('data-left-scope', 'folded')
    expect(button()).toHaveAttribute('data-left-site', 'open')

    await userEvent.click(button())
    expect(mark(container)).toHaveAttribute('data-left-scope', 'open')
    expect(button()).toHaveAttribute('aria-expanded', 'true')
    expect(document.cookie).toContain('asinko-left-column-submit=open')
    expect(document.cookie).not.toContain('asinko-left-column=folded')

    // Leaving the page: the button goes back to the site's choice.
    rerender(<LeftColumnToggle initialFolded={false} />)
    expect(button()).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(button())
    expect(button()).toHaveAttribute('data-left-site', 'folded')
  })

  it('draws the mark hidden, with what the page read, before anything mounts', () => {
    const { container } = renderWithIntl(<LeftColumnScope initialOpen />)
    expect(mark(container)).toHaveAttribute('hidden')
    expect(mark(container)).toHaveAttribute('data-left-scope', 'open')
  })
})
