// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { pieColors, pieSlices } from './poll-pie'

const BOX = { cx: 100, cy: 70, r: 80 }

describe('pieColors (specs/poll-pie PP-02)', () => {
  it('a hue per place, the most voted first; a tie in the options order; no votes, no color', () => {
    const tones = pieColors([
      { id: 'a', share: 0.3 },
      { id: 'b', share: 0.2 },
      { id: 'c', share: 0.3 },
      { id: 'd', share: 0 },
      { id: 'e', share: null },
    ])
    expect(tones.get('a')).toBe(0)
    // Tied with a: the next hue, so the two slices read apart.
    expect(tones.get('c')).toBe(6)
    expect(tones.get('b')).toBe(2)
    expect(tones.has('d')).toBe(false)
    expect(tones.has('e')).toBe(false)
  })
})

describe('pieSlices (specs/poll-pie PP-01)', () => {
  it('one slice per option with votes, from the top clockwise, as wide as its share', () => {
    const slices = pieSlices(
      [
        { id: 'a', share: 0.5 },
        { id: 'b', share: 0.25 },
        { id: 'c', share: 0.25 },
        { id: 'd', share: 0 },
      ],
      BOX,
    )
    expect(slices.map((slice) => slice.id)).toEqual(['a', 'b', 'c'])
    // The first one starts at the top: (100, 70 - 80 * 0.6).
    expect(slices[0]!.top).toMatch(/^M 100 70 L 100 22 /)
    // Half of the disc: from the top to the bottom, through the right.
    expect(slices[0]!.mid).toBeCloseTo(0)
    expect(slices[1]!.mid).toBeCloseTo((3 * Math.PI) / 4)
  })

  it('draws a side only for the part of a slice in the front half', () => {
    const [back, front] = pieSlices(
      [
        { id: 'back', share: 0.25 },
        { id: 'front', share: 0.75 },
      ],
      BOX,
    )
    // From the top to the right (-90° to 0°): all behind.
    expect(back!.side).toBeNull()
    expect(front!.side).toMatch(/^M /)
  })

  it('a single option is the whole disc', () => {
    const [only] = pieSlices([{ id: 'a', share: 1 }], BOX)
    expect(only!.top).toContain('A 80 48 0 1 1')
    expect(only!.side).not.toBeNull()
  })

  it('nothing without votes', () => {
    expect(pieSlices([{ id: 'a', share: null }], BOX)).toEqual([])
  })
})
