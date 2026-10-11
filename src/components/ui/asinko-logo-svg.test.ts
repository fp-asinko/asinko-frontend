// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { LOGO_LETTERS } from './asinko-logo'
import { asinkoLogoSvg } from './asinko-logo-svg'

describe('asinkoLogoSvg (specs/share-preview SP-01)', () => {
  it('writes the six letters in the ink and the dot in its blue, with no theme classes', () => {
    const svg = asinkoLogoSvg({ ink: '#17181a', dot: '#155de9' })
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(svg.match(/<path /g)).toHaveLength(LOGO_LETTERS.length)
    expect(svg).toContain('<g fill="#17181a">')
    expect(svg).toContain('fill="#155de9"')
    expect(svg).not.toMatch(/class=|currentColor/)
  })
})
