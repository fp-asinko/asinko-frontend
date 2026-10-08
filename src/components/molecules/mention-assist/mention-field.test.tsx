import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { MentionField } from './mention-field'

function Field() {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  return (
    <div className="relative">
      <textarea aria-label="Body" ref={ref} />
      <MentionField fieldRef={ref} search={vi.fn().mockResolvedValue({ ok: true, data: [] })} />
    </div>
  )
}

describe('MentionField (specs/mention-autocomplete MA-09)', () => {
  it('loads the suggestions only once the field is focused, keeping its focus and text', async () => {
    renderWithIntl(<Field />)
    const body = screen.getByRole('textbox', { name: 'Body' })
    expect(body).not.toHaveAttribute('aria-autocomplete')

    await userEvent.type(body, 'Hi')
    await waitFor(() => expect(body).toHaveAttribute('aria-autocomplete', 'list'), {
      timeout: 10_000,
    })
    expect(body).toHaveFocus()
    expect(body).toHaveValue('Hi')
  })
})
