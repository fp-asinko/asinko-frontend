import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThesisConfirm, type ThesisSummary } from './thesis-confirm'

const SUMMARY: ThesisSummary = {
  asset: '$NVDA',
  claim: 'NVDA closes above 200',
  direction: 'BELOW',
  targetPrice: 1234.5,
  deadline: '2026-12-31',
  conviction: 'EXTREME',
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
  it('sums up the thesis and says it is final, in the page’s language', async () => {
    renderConfirm()
    const dialog = await screen.findByRole('dialog', { name: 'Publicar tesis' })
    expect(dialog).toHaveTextContent('$NVDA')
    expect(dialog).toHaveTextContent('NVDA closes above 200')
    expect(dialog).toHaveTextContent('Por debajo de 1234,5 al 31 dic 2026')
    expect(dialog).toHaveTextContent('Convicción: Extrema')
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
