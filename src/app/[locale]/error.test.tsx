import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import ErrorPage from './error'

describe('Error page (F-25)', () => {
  const error = Object.assign(new Error('db password leaked in message'), { digest: 'abc' })

  it('shows a translated message without the error details', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderWithIntl(<ErrorPage error={error} retry={vi.fn()} />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/db password/)).not.toBeInTheDocument()
  })

  it('retries when the user asks', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const retry = vi.fn()
    renderWithIntl(<ErrorPage error={error} retry={retry} />)

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
