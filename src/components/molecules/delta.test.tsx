import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { Delta } from './delta'

describe('Delta', () => {
  it('shows a rise in bullish color with a spoken label', () => {
    const { container } = renderWithIntl(<Delta value={2.14} />)
    expect(container.firstElementChild).toHaveClass('text-bullish')
    expect(screen.getByText('up 2.14%')).toHaveClass('sr-only')
  })

  it('shows a fall in bearish color without the minus sign duplicated', () => {
    const { container } = renderWithIntl(<Delta value={-3.82} />)
    expect(container.firstElementChild).toHaveClass('text-bearish')
    expect(screen.getByText('down 3.82%')).toBeInTheDocument()
  })

  it('treats zero as unchanged', () => {
    const { container } = renderWithIntl(<Delta value={0} />)
    expect(container.firstElementChild).toHaveClass('text-muted-foreground')
    expect(screen.getByText('unchanged')).toBeInTheDocument()
  })

  it('never relies on color alone: there is always an arrow icon', () => {
    const { container } = renderWithIntl(<Delta value={1} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
