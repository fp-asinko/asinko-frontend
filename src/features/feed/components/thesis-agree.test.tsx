import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import type { ThesisAgreement } from '../feed.types'
import { ThesisAgree } from './thesis-agree'

const action = vi.hoisted(() => ({ answerThesis: vi.fn() }))
vi.mock('../actions/answer-thesis.action', () => action)
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const ID = '00000000-0000-4000-8000-000000000001'
const OPEN: ThesisAgreement = { yes: 6, no: 3, viewerVote: null, canVote: true }

/** A promise the test resolves by hand, to look at the optimistic state in between. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => (resolve = done))
  return { promise, resolve }
}

const BET = {
  handle: '@maria',
  direction: 'above',
  price: 240,
  deadline: '2027-11-04T12:00:00.000Z',
} as const

const render = (
  agreement: ThesisAgreement = OPEN,
  assetSymbol: string | null = 'NVDA',
  bet: typeof BET | null = BET,
) =>
  renderWithIntl(
    <ThesisAgree thesisId={ID} assetSymbol={assetSymbol} bet={bet} agreement={agreement} />,
  )

describe('ThesisAgree (specs/thesis-agree)', () => {
  beforeEach(() => action.answerThesis.mockReset())

  it('asks with Yes and No, without the shares before answering (AG-01, Q3)', () => {
    render()
    const group = screen.getByRole('group', { name: 'Do you agree?' })
    expect(group).toContainElement(screen.getByRole('button', { name: 'Yes', pressed: false }))
    expect(group).toContainElement(screen.getByRole('button', { name: 'No', pressed: false }))
    expect(screen.queryByText(/votes/)).toBeNull()
  })

  it('puts No first and Yes second (PO, 2026-11-09)', () => {
    render()
    const buttons = screen.getAllByRole('button', { name: /^(Yes|No)$/ })
    expect(buttons.map((button) => button.textContent)).toEqual(['No', 'Yes'])
  })

  it('shows the answer and the shares at once, then the server’s counts (AG-04)', async () => {
    const saved = deferred<unknown>()
    action.answerThesis.mockReturnValue(saved.promise)
    render()
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))

    expect(action.answerThesis).toHaveBeenCalledWith({ thesisId: ID, value: 'yes' })
    expect(screen.getByRole('button', { name: 'Yes', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('70% yes · 30% no · 10 votes')).toBeInTheDocument()
    // Each button fills with its share, as the prototype's (PO, 2026-11-05).
    expect(screen.getByRole('button', { name: 'Yes' })).toHaveTextContent('Yes70%')
    expect(screen.getByRole('button', { name: 'No' })).toHaveTextContent('No30%')

    saved.resolve({ ok: true, data: { yes: 8, no: 2, viewerVote: 'yes', canVote: true } })
    expect(await screen.findByText('80% yes · 20% no · 10 votes')).toBeInTheDocument()
    // Answering Yes invites nothing (AG-12).
    expect(screen.queryByRole('link', { name: 'Bet against it' })).toBeNull()
  })

  it('changes with the other answer, moving the count (AG-05, Q4)', async () => {
    const saved = deferred<unknown>()
    action.answerThesis.mockReturnValue(saved.promise)
    render({ yes: 7, no: 3, viewerVote: 'yes', canVote: true })
    // Answered on load: the shares show.
    expect(screen.getByText('70% yes · 30% no · 10 votes')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(action.answerThesis).toHaveBeenCalledWith({ thesisId: ID, value: 'no' })
    expect(screen.getByText('60% yes · 40% no · 10 votes')).toBeInTheDocument()
    saved.resolve({ ok: true, data: { yes: 6, no: 4, viewerVote: 'no', canVote: true } })
    expect(await screen.findByRole('button', { name: 'No', pressed: true })).toBeInTheDocument()
  })

  it('takes the answer back when pressing the same one', async () => {
    action.answerThesis.mockResolvedValue({ ok: true, data: OPEN })
    render({ yes: 7, no: 3, viewerVote: 'yes', canVote: true })
    await userEvent.click(screen.getByRole('button', { name: 'Yes', pressed: true }))
    expect(action.answerThesis).toHaveBeenCalledWith({ thesisId: ID, value: null })
  })

  it('invites to bet the other way after a No, on the same asset, with no way to close it (AG-10, AG-11)', async () => {
    action.answerThesis.mockResolvedValue({
      ok: true,
      data: { yes: 6, no: 4, viewerVote: 'no', canVote: true },
    })
    render()
    await userEvent.click(screen.getByRole('button', { name: 'No' }))

    // Its bet, named (PO, 2026-11-09), and what is in it for the reader.
    expect(
      screen.getByText('@maria bets $NVDA goes above $240 by Nov 4, 2027.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Take the other side: if you're right, it counts toward your accuracy."),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bet against it' })).toHaveAttribute(
      'href',
      `/submit?community=NVDA&type=thesis&counter=${ID}`,
    )
    // No ✕ (PO, 2026-11-09): answering Yes is what takes it away (AG-12).
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('invites again on a later visit while the No stands (AG-10)', () => {
    render({ yes: 6, no: 4, viewerVote: 'no', canVote: true })
    expect(screen.getByRole('link', { name: 'Bet against it' })).toBeInTheDocument()
  })

  it('invites to an empty thesis when this one has no asset (AG-13)', async () => {
    action.answerThesis.mockResolvedValue({
      ok: true,
      data: { yes: 6, no: 4, viewerVote: 'no', canVote: true },
    })
    render(OPEN, null, null)
    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    // Nothing to name: the question alone.
    expect(screen.getByText("Think they're wrong?")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bet against it' })).toHaveAttribute(
      'href',
      '/submit?type=thesis',
    )
  })

  it('shows the result without buttons to its author or once closed (AG-02, AG-07)', () => {
    render({ yes: 1, no: 3, viewerVote: null, canVote: false })
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('25% yes · 75% no · 4 votes')).toBeInTheDocument()
  })

  it('shows a guest the result, and opens the account modal instead of answering (AG-08)', async () => {
    renderWithIntl(
      <AuthGateProvider signedIn={false}>
        <ThesisAgree thesisId={ID} assetSymbol="NVDA" bet={BET} agreement={OPEN} />
      </AuthGateProvider>,
    )
    expect(screen.getByText('67% yes · 33% no · 9 votes')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(await screen.findByRole('dialog', { name: 'Vote to see where you stand' })).toBeVisible()
    expect(action.answerThesis).not.toHaveBeenCalled()
  })

  it('goes back and says so when the answer fails, without the invitation (AG-04)', async () => {
    action.answerThesis.mockResolvedValue({ ok: false, error: 'api.errors.UNKNOWN' })
    render()
    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save your answer. Try again.',
    )
    expect(screen.getByRole('button', { name: 'No', pressed: false })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Bet against it' })).toBeNull()
  })

  it('ignores a second press while saving (AG-09)', async () => {
    const saved = deferred<unknown>()
    action.answerThesis.mockReturnValue(saved.promise)
    render()
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(action.answerThesis).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-disabled', 'true')
    saved.resolve({ ok: true, data: { yes: 7, no: 3, viewerVote: 'yes', canVote: true } })
  })
})
