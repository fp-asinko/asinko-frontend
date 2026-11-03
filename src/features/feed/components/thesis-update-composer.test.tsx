import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThesisUpdateComposer } from './thesis-update-composer'

const action = vi.hoisted(() => ({ createThesisUpdate: vi.fn() }))
vi.mock('../actions/create-thesis-update.action', () => action)

async function openForm() {
  await userEvent.click(screen.getByRole('button', { name: 'Post an update' }))
  return screen.findByRole('textbox', { name: 'Your update' }, { timeout: 8000 })
}

const post = () => screen.getByRole('button', { name: 'Post update' })

describe('ThesisUpdateComposer (specs/thesis-arguments TA-10 to TA-12)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('opens the form in place, focused, saying updates are for good', async () => {
    renderWithIntl(<ThesisUpdateComposer thesisId="t1" />)
    const field = await openForm()
    expect(field).toHaveFocus()
    expect(field).toHaveAccessibleDescription(/can’t be edited or deleted/)
  })

  it('asks for a text, then posts it and closes', async () => {
    action.createThesisUpdate.mockResolvedValue({ ok: true, data: { id: 'u-1' } })
    renderWithIntl(<ThesisUpdateComposer thesisId="t1" />)
    const field = await openForm()
    await userEvent.click(post())
    expect(screen.getByRole('alert')).toHaveTextContent('Write what changed')
    await userEvent.type(field, 'CPI came in hot. Holding.')
    expect(screen.getByText('25/2000')).toBeInTheDocument()
    await userEvent.click(post())
    expect(action.createThesisUpdate).toHaveBeenCalledWith({
      thesisId: 't1',
      body: 'CPI came in hot. Holding.',
    })
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Post an update' })).toBeInTheDocument(),
    )
    // Said to screen readers: the form is gone and the update shows above.
    expect(screen.getByRole('status')).toHaveTextContent('Update posted')
  })

  it('closes with Cancel or Esc, the focus back on the pill', async () => {
    renderWithIntl(<ThesisUpdateComposer thesisId="t1" />)
    await openForm()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    const pill = screen.getByRole('button', { name: 'Post an update' })
    await vi.waitFor(() => expect(pill).toHaveFocus())
    await openForm()
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Post an update' })).toHaveFocus(),
    )
    expect(action.createThesisUpdate).not.toHaveBeenCalled()
  })

  it('says when the thesis is no longer open (TA-11)', async () => {
    action.createThesisUpdate.mockResolvedValue({
      ok: false,
      error: 'feed.thesis.updates.errors.notOpen',
    })
    renderWithIntl(<ThesisUpdateComposer thesisId="t1" />)
    const field = await openForm()
    await userEvent.type(field, 'Late.')
    await userEvent.click(post())
    expect(await screen.findByRole('alert')).toHaveTextContent('no longer open')
  })
})
