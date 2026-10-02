import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import GlobalError from './global-error'

vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn() }))

// Rendered inside the test container: React warns about <html> inside <div>, which is expected here.
describe('GlobalError', () => {
  it('shows a heading and retries on demand', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const retry = vi.fn()
    render(<GlobalError error={new Error('root layout failed')} retry={retry} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('reports the error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { reportError } = await import('@/lib/observability/report-error')
    const error = new Error('root layout failed')
    render(<GlobalError error={error} retry={vi.fn()} />)
    expect(reportError).toHaveBeenCalledWith(error)
  })
})
