import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MentionOption } from '@/lib/mentions/mentions.types'
import { renderWithIntl } from '@/test/render-with-intl'
import { MentionAssist, type MentionSearch } from './mention-assist'

const BTC: MentionOption = {
  kind: 'asset',
  handle: '$BTC',
  label: 'Bitcoin',
  avatarUrl: null,
  colorKey: 'BTC',
}
const BCH: MentionOption = { ...BTC, handle: '$BCH', label: 'Bitcoin Cash', colorKey: 'BCH' }

/** A controlled textarea, as the comment box, with the list hooked onto it. */
function Harness({ search, onKey }: { search: MentionSearch; onKey?: () => void }) {
  const [field, setField] = useState<HTMLTextAreaElement | null>(null)
  const [text, setText] = useState('')
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- sees keys that escape the list
    <div className="relative" onKeyDown={onKey}>
      <textarea
        aria-label="Body"
        ref={(element) => {
          if (element && element !== field) setField(element)
        }}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {field && <MentionAssist field={field} search={search} />}
      <p data-testid="value">{text}</p>
      <button type="button" onClick={() => setText('')}>
        Clear
      </button>
    </div>
  )
}

const body = () => screen.getByRole('textbox', { name: 'Body' })
const search = vi.fn<MentionSearch>()

describe('MentionAssist (specs/mention-autocomplete)', () => {
  beforeEach(() => {
    search.mockReset()
    search.mockResolvedValue({ ok: true, data: [BTC, BCH] })
  })

  it('waits for a letter after the symbol, then suggests (MA-01, MA-02, Q2)', async () => {
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), 'Long $')
    await new Promise((done) => setTimeout(done, 200))
    expect(search).not.toHaveBeenCalled()

    await userEvent.type(body(), 'bi')
    const list = await screen.findByRole('listbox', { name: 'Suggestions' })
    expect(search).toHaveBeenLastCalledWith({ kind: 'asset', q: 'bi' })
    // The avatar is decorative: each option reads as its handle and its name.
    expect(within(list).getByRole('option', { name: '$BTC Bitcoin' })).toBeInTheDocument()
    expect(within(list).getByRole('option', { name: '$BCH Bitcoin Cash' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 suggestions')
  })

  it('points the textbox at the list and the marked option (MA-07)', async () => {
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), '$bi')
    const list = await screen.findByRole('listbox')
    const [first, second] = within(list).getAllByRole('option')
    expect(body()).toHaveAttribute('aria-autocomplete', 'list')
    expect(body()).toHaveAttribute('aria-controls', list.id)
    expect(body()).toHaveAttribute('aria-activedescendant', first!.id)
    expect(first).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{ArrowDown}')
    expect(body()).toHaveAttribute('aria-activedescendant', second!.id)
    await userEvent.keyboard('{ArrowUp}')
    expect(body()).toHaveAttribute('aria-activedescendant', first!.id)
  })

  it('writes the whole mention and a space with Enter, caret after it (MA-04, MA-05)', async () => {
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), 'Long $bi')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(body()).toHaveValue('Long $BCH ')
    expect(screen.getByTestId('value')).toHaveTextContent('Long $BCH')
    expect((body() as HTMLTextAreaElement).selectionStart).toBe('Long $BCH '.length)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('$BCH added')
  })

  // One choice per test: user-event keeps its own copy of the value and does not see a change
  // written with the native setter, so typing again after a choice would start from its old copy
  // (the browser and React do see it: the Enter test checks React's state).
  it('chooses with Tab, keeping the focus', async () => {
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), '$bi')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{Tab}')
    expect(body()).toHaveValue('$BTC ')
    expect(body()).toHaveFocus()
  })

  it('chooses with a tap, keeping the focus', async () => {
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), '$bc')
    await userEvent.click(await screen.findByRole('option', { name: /\$BCH/ }))
    expect(body()).toHaveValue('$BCH ')
    expect(body()).toHaveFocus()
  })

  it('closes with Esc without letting the key reach the editor (MA-05)', async () => {
    const onKey = vi.fn()
    renderWithIntl(<Harness search={search} onKey={onKey} />)
    await userEvent.type(body(), '$bi')
    await screen.findByRole('listbox')
    onKey.mockClear()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onKey).not.toHaveBeenCalled()
    expect(body()).toHaveValue('$bi')
  })

  it('closes with a space, and never opens inside a word (MA-01, MA-06)', async () => {
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), '$bi')
    await screen.findByRole('listbox')
    await userEvent.type(body(), ' ')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    search.mockClear()
    await userEvent.type(body(), 'mail@host')
    await new Promise((done) => setTimeout(done, 200))
    expect(search).not.toHaveBeenCalled()
  })

  it('says when nothing matches or the search fails, without blocking the typing (MA-03)', async () => {
    search.mockResolvedValue({ ok: true, data: [] })
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), '#zz')
    // Seen in the panel and announced (WCAG 4.1.3).
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('No matches'))
    expect(screen.getAllByText('No matches')).toHaveLength(2)
    await userEvent.keyboard('{Enter}')
    expect(body()).toHaveValue('#zz\n')

    search.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    await userEvent.type(body(), '@ma')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Could not load the suggestions'),
    )
  })

  it('looks for each symbol in its own place (MA-02)', async () => {
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), '#de')
    await waitFor(() => expect(search).toHaveBeenLastCalledWith({ kind: 'community', q: 'de' }))
    await userEvent.type(body(), ' @ma')
    await waitFor(() => expect(search).toHaveBeenLastCalledWith({ kind: 'user', q: 'ma' }))
  })
})

describe('MentionAssist: speed (specs/mention-autocomplete § 3)', () => {
  beforeEach(() => {
    search.mockReset()
  })

  it('says "Searching…" at once, before the answer', async () => {
    let answer!: (value: Awaited<ReturnType<MentionSearch>>) => void
    search.mockReturnValue(new Promise((done) => (answer = done)))
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), '$bi')
    expect(screen.getByText('Searching…')).toBeInTheDocument()
    answer({ ok: true, data: [BTC] })
    expect(await screen.findByRole('option', { name: /\$BTC/ })).toBeInTheDocument()
  })

  it('shows what a shorter query found while the longer one travels', async () => {
    search.mockResolvedValueOnce({ ok: true, data: [BTC, BCH] })
    search.mockReturnValueOnce(new Promise(() => {}))
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), '$b')
    await screen.findByRole('option', { name: /\$BCH/ })
    // "bc": only $BCH still matches, shown before the server answers.
    await userEvent.type(body(), 'c')
    expect(screen.getByRole('option', { name: /\$BCH/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /\$BTC/ })).not.toBeInTheDocument()
  })

  it('answers a query already asked at once, without asking again', async () => {
    search.mockResolvedValue({ ok: true, data: [BTC] })
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), '$bi')
    await screen.findByRole('option', { name: /\$BTC/ })
    await userEvent.type(body(), 't{Backspace}')
    await screen.findByRole('option', { name: /\$BTC/ })
    const calls = search.mock.calls.filter(([input]) => input.q === 'bi')
    expect(calls).toHaveLength(1)
  })
})

describe('MentionAssist: mentions in blue while writing (MA-12)', () => {
  beforeEach(() => {
    search.mockReset()
    search.mockResolvedValue({ ok: true, data: [] })
  })

  const layer = () => document.querySelector<HTMLElement>('[data-mention-highlight]')

  it('paints each mention over the textarea, which keeps only its caret', async () => {
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), 'Long $BTC with @maria')
    expect(layer()).toHaveAttribute('aria-hidden', 'true')
    expect(layer()).toHaveTextContent('Long $BTC with @maria')
    const painted = [...layer()!.querySelectorAll('.text-mention')].map((each) => each.textContent)
    expect(painted).toEqual(['$BTC', '@maria'])
    expect(body()).toHaveAttribute('data-mention-painted')
  })

  it('follows a value set by code, as a comment box emptied after sending', async () => {
    renderWithIntl(<Harness search={search} />)
    await userEvent.type(body(), '#defi')
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(body()).toHaveValue('')
    expect(layer()!.querySelector('.text-mention')).toBeNull()
    expect(layer()!.textContent).toBe('​')
  })
})
