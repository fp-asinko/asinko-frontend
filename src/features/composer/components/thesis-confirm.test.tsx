import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThesisConfirm, type ThesisSummary } from './thesis-confirm'

const SUMMARY: ThesisSummary = {
  claim: 'NVDA closes above 200',
  reasoning: '**Data centers** keep _buying_.',
  author: { username: 'demo', avatarUrl: null },
  ticket: {
    id: 'preview',
    asset: { symbol: 'NVDA', name: 'NVIDIA', path: '/asset/NVDA', logoUrl: null },
    target: { direction: 'below', price: 150 },
    current: null,
    reference: { price: 180, at: null },
    deadline: '2026-12-31T23:59:59.000Z',
    number: null,
    conviction: 4,
    state: 'open',
    resolution: null,
    cancellation: null,
  },
}

function renderConfirm(props: Partial<Parameters<typeof ThesisConfirm>[0]> = {}) {
  const onBack = vi.fn()
  const onConfirm = vi.fn()
  renderWithIntl(
    <ThesisConfirm
      summary={SUMMARY}
      pending={false}
      error={null}
      onBack={onBack}
      onConfirm={onConfirm}
      {...props}
    />,
    { locale: 'es' },
  )
  return { onBack, onConfirm }
}

describe('ThesisConfirm (specs/thesis-create TC-11, TC-12)', () => {
  it('shows the thesis as its ticket and says it is final, in the page’s language', async () => {
    renderConfirm()
    const dialog = await screen.findByRole('dialog', { name: 'Publicar tesis' })
    expect(dialog).toHaveTextContent('NVDA closes above 200')
    // The ticket as it will be published (PO 2026-11-06), its asset not a link out of the form.
    expect(dialog).toHaveTextContent(/Activo.*\$NVDA.*Convicción.*Extrema.*Objetivo/)
    expect(dialog).toHaveTextContent('-16,7 %')
    expect(within(dialog).queryByRole('link')).toBeNull()
    // As its card: who publishes and THESIS first, the claim, and the reasoning as text.
    expect(dialog).toHaveTextContent(
      /demo.*Tesis.*Activo.*NVDA closes above 200.*Data centers keep buying\./,
    )
    expect(dialog).toHaveAccessibleDescription(/no se puede editar ni borrar/)
  })

  it('sends only with the disclaimer accepted, which takes the focus', async () => {
    const { onConfirm } = renderConfirm()
    const checkbox = await screen.findByRole('checkbox', {
      name: 'Entiendo que esto no es asesoramiento financiero',
    })
    await vi.waitFor(() => expect(checkbox).toHaveFocus())
    const send = screen.getByRole('button', { name: 'Publicar tesis' })
    await userEvent.click(send)
    expect(onConfirm).not.toHaveBeenCalled()
    // It says why (WCAG 3.3.1), tied to the checkbox.
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Confirma que esto no es asesoramiento financiero',
    )
    expect(checkbox).toHaveAccessibleDescription('Confirma que esto no es asesoramiento financiero')
    await userEvent.click(checkbox)
    await userEvent.click(send)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('goes back without sending, and says an error tied to the checkbox', async () => {
    const { onBack, onConfirm } = renderConfirm({ error: 'Something went wrong' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('Something went wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(onBack).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('says it is publishing, and cannot be left meanwhile', async () => {
    const { onBack } = renderConfirm({ pending: true })
    const sending = await screen.findByRole('button', { name: 'Publicando…' })
    expect(sending).toHaveAttribute('aria-disabled', 'true')
    expect(sending).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Volver' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    expect(onBack).not.toHaveBeenCalled()
  })
})
