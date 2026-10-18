import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { LeftColumnFold } from './left-column-fold'

describe('LeftColumnFold (specs/submit-tools ST-08, ST-09)', () => {
  afterEach(() => localStorage.clear())

  it('starts folded and says so to the shell, which folds the column by CSS', () => {
    renderWithIntl(<LeftColumnFold />)
    const show = screen.getByRole('button', { name: 'Your interests' })
    expect(show).toHaveAttribute('aria-expanded', 'false')
    expect(show).toHaveAttribute('aria-controls', 'left-column')
    expect(show).toHaveAttribute('data-left-fold', 'folded')
  })

  it('unfolds and folds again, remembering it for the next post', async () => {
    const first = renderWithIntl(<LeftColumnFold />)
    await userEvent.click(screen.getByRole('button', { name: 'Your interests' }))
    const hide = screen.getByRole('button', { name: 'Your interests' })
    expect(hide).toHaveAttribute('data-left-fold', 'open')
    expect(hide).toHaveAttribute('aria-expanded', 'true')
    first.unmount()

    renderWithIntl(<LeftColumnFold />)
    expect(screen.getByRole('button', { name: 'Your interests' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Your interests' }))
    expect(screen.getByRole('button', { name: 'Your interests' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('starts folded when the browser keeps nothing (private mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    renderWithIntl(<LeftColumnFold />)
    expect(screen.getByRole('button', { name: 'Your interests' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    vi.restoreAllMocks()
  })
})
