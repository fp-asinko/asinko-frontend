import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BearMark, BullMark } from './stance-marks'

describe('stance marks (specs/thesis-agree AG-19)', () => {
  it.each([
    ['bull', BullMark],
    ['bear', BearMark],
  ] as const)('draws the %s in the text color, hidden from screen readers', (name, Mark) => {
    const { container } = render(<Mark className="size-4" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg).toHaveAttribute('data-mark', name)
    expect(svg).toHaveClass('size-4')
  })
})
