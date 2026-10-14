import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TelegramMark, WhatsAppMark } from './share-marks'

describe('share marks (specs/share-menu SM-03)', () => {
  it.each([
    ['WhatsApp', WhatsAppMark],
    ['Telegram', TelegramMark],
  ] as const)('draws the %s mark in the text color, hidden from screen readers', (_name, Mark) => {
    const { container } = render(<Mark className="size-5" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('fill', 'currentColor')
    expect(svg).toHaveClass('size-5')
    expect(svg.querySelector('path')?.getAttribute('d')).toMatch(/^M/)
  })
})
