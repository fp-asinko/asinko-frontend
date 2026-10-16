import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { LinkSite } from '@/lib/profile-links'
import { LinkMark } from './link-marks'

const SITES: LinkSite[] = [
  'x',
  'linkedin',
  'youtube',
  'instagram',
  'github',
  'substack',
  'tradingview',
]

describe('LinkMark (specs/profile-presentation PP-03)', () => {
  it.each(SITES)('draws the %s mark in the text color, hidden from screen readers', (site) => {
    const { container } = render(<LinkMark site={site} className="size-4" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('fill', 'currentColor')
    expect(svg).toHaveClass('size-4')
    expect(svg.querySelector('path')?.getAttribute('d')).toMatch(/^M/)
  })

  it('draws a globe for any other site', () => {
    const { container } = render(<LinkMark site="web" className="size-4" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveClass('lucide-globe')
  })
})
