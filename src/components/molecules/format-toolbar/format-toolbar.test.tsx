import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { applyFormat, FormatToolbar, formatShortcut } from './format-toolbar'

function Editor({ value = 'rates are up' }: { value?: string }) {
  const field = useRef<HTMLTextAreaElement>(null)
  return (
    <>
      <FormatToolbar fieldRef={field} />
      <textarea
        ref={field}
        aria-label="Body"
        defaultValue={value}
        onKeyDown={(event) => {
          const kind = formatShortcut(event)
          if (!kind) return
          event.preventDefault()
          applyFormat(event.currentTarget, kind)
        }}
      />
    </>
  )
}

const body = () => screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Body' })

describe('FormatToolbar (specs/submit-tools ST-04 to ST-06)', () => {
  it('names each button with its shortcut, in a toolbar', () => {
    renderWithIntl(<Editor />)
    const toolbar = screen.getByRole('toolbar', { name: 'Text format' })
    expect(toolbar).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+B',
    )
    // Its shortcut in the hover hint, not a native title (PO, 2026-10-27).
    expect(screen.getByText('Bold (Ctrl+B)')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Bold' })).not.toHaveAttribute('title')
    for (const name of ['Italic', 'Link', 'List', 'Quote', 'Code']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('formats the chosen text and keeps it chosen', async () => {
    renderWithIntl(<Editor />)
    body().setSelectionRange(6, 9)
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }))
    expect(body()).toHaveValue('rates **are** up')
    expect([body().selectionStart, body().selectionEnd]).toEqual([8, 11])
    expect(body()).toHaveFocus()
  })

  it('marks lines as a list or a quote', async () => {
    renderWithIntl(<Editor value={'first\nsecond'} />)
    body().setSelectionRange(0, 12)
    await userEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(body()).toHaveValue('- first\n- second')
  })

  it('formats with Ctrl or ⌘ + B, I and K in the field', async () => {
    renderWithIntl(<Editor />)
    body().focus()
    body().setSelectionRange(0, 5)
    await userEvent.keyboard('{Control>}i{/Control}')
    expect(body()).toHaveValue('_rates_ are up')
    body().setSelectionRange(12, 14)
    await userEvent.keyboard('{Meta>}k{/Meta}')
    expect(body()).toHaveValue('_rates_ are [up](https://)')
  })

  it('is one Tab stop, the arrows, Home and End moving along it (WAI-ARIA toolbar)', async () => {
    renderWithIntl(<Editor />)
    await userEvent.tab()
    const bold = screen.getByRole('button', { name: 'Bold' })
    expect(bold).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('button', { name: 'Code' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(bold).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: 'Code' })).toHaveFocus()
    // Out with a single Tab: the field.
    await userEvent.tab()
    expect(body()).toHaveFocus()
  })
})
