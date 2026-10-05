import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InstagramMark, RedditMark, XMark } from './brand-marks'

describe('brand marks (G-13)', () => {
  it.each([
    ['Reddit', RedditMark],
    ['Instagram', InstagramMark],
    ['X', XMark],
  ] as const)('draws the %s mark in the text color, hidden from screen readers', (_name, Mark) => {
    const { container } = render(<Mark className="size-5" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('fill', 'currentColor')
    expect(svg).toHaveClass('size-5')
    expect(svg.querySelector('path')?.getAttribute('d')).toMatch(/^M/)
  })
})
