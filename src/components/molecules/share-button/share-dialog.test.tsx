import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ShareDialog } from './share-dialog'

const URL_ = 'https://asinko.com/en/post/1/hello'

function renderDialog() {
  renderWithIntl(
    <ShareDialog
      open
      onOpenChange={vi.fn()}
      url={URL_}
      title="The Fed cuts"
      preview="/en/post/1/opengraph-image/card"
      returnFocusTo={createRef()}
    />,
  )
  return screen.getByRole('dialog', { name: 'Share post' })
}

describe('ShareDialog (specs/share-menu SM-02 to SM-05)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('names each network with its new tab, and email without one', () => {
    const dialog = renderDialog()
    for (const name of ['X', 'WhatsApp', 'Telegram']) {
      const link = within(dialog).getByRole('link', { name: `${name} (opens in a new tab)` })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
    const email = within(dialog).getByRole('link', { name: 'Email' })
    expect(email).not.toHaveAttribute('target')
    expect(email).toHaveAttribute('href', expect.stringMatching(/^mailto:\?subject=/))
  })

  it('says when the clipboard refuses, and goes back to Copy link after 2s', async () => {
    // user-event installs the clipboard that jsdom lacks.
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    const dialog = renderDialog()
    await user.click(within(dialog).getByRole('button', { name: 'Copy link' }))
    expect(within(dialog).getByRole('button', { name: 'Could not copy' })).toBeInTheDocument()
    expect(within(dialog).getByRole('status')).toHaveTextContent('Could not copy')
    expect(
      await within(dialog).findByRole('button', { name: 'Copy link' }, { timeout: 3000 }),
    ).toBeInTheDocument()
  })

  it('leaves out an image that fails, keeping the options', () => {
    const dialog = renderDialog()
    fireEvent.error(within(dialog).getByRole('img', { name: 'The Fed cuts' }))
    expect(within(dialog).queryByRole('img')).toBeNull()
    expect(within(dialog).getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
  })
})
