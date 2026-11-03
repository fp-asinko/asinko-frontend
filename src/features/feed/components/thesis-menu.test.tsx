import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThesisMenu } from './thesis-menu'

const action = vi.hoisted(() => ({ cancelThesis: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/cancel-thesis.action', () => action)

const CLAIM = 'BTC prints a new all-time high'

async function openConfirmation() {
  await userEvent.click(screen.getByRole('button', { name: `Options for the thesis ${CLAIM}` }))
  await userEvent.click(await screen.findByRole('menuitem', {}, { timeout: 8000 }))
  return screen.findByRole('dialog', { name: 'Cancel this thesis?' })
}

describe('ThesisMenu (specs/thesis-detail TD-12 to TD-15)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('offers to cancel it, and says what that means before doing it', async () => {
    renderWithIntl(<ThesisMenu id="t1" claim={CLAIM} />)
    const dialog = await openConfirmation()
    expect(dialog).toHaveTextContent('It stays on your track record as Cancelled')
    // The focus goes where the person writes: the reason.
    expect(screen.getByRole('textbox', { name: 'Why are you cancelling it?' })).toHaveFocus()
  })

  it('asks for a reason, and counts it against 280 (Q4)', async () => {
    renderWithIntl(<ThesisMenu id="t1" claim={CLAIM} />)
    await openConfirmation()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel thesis' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Say why you are cancelling it')
    expect(action.cancelThesis).not.toHaveBeenCalled()
    await userEvent.type(screen.getByRole('textbox'), 'Wrong asset.')
    expect(screen.getByText('12/280')).toBeInTheDocument()
  })

  it('cancels it and asks the page again, closing the confirmation', async () => {
    action.cancelThesis.mockResolvedValue({ ok: true, data: null })
    renderWithIntl(<ThesisMenu id="t1" claim={CLAIM} />)
    await openConfirmation()
    await userEvent.type(screen.getByRole('textbox'), 'Wrong asset.')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel thesis' }))
    expect(action.cancelThesis).toHaveBeenCalledWith({ thesisId: 't1', reason: 'Wrong asset.' })
    await vi.waitFor(() => expect(router.refresh).toHaveBeenCalled())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('says when it can no longer be cancelled (TD-15)', async () => {
    action.cancelThesis.mockResolvedValue({
      ok: false,
      error: 'feed.thesis.cancel.errors.notCancellable',
    })
    renderWithIntl(<ThesisMenu id="t1" claim={CLAIM} />)
    await openConfirmation()
    await userEvent.type(screen.getByRole('textbox'), 'Too late.')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel thesis' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('It can no longer be cancelled')
    expect(router.refresh).toHaveBeenCalled()
  })
})
