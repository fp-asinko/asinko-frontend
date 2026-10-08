// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { gridMove } from './grid-move'

// Two sections: 10 emojis (rows of 8 and 2) and 20 (8, 8 and 4).
const LENGTHS = [10, 20]

describe('gridMove (specs/emoji-picker EP-07)', () => {
  it('moves by one sideways, across sections, and Home or End go to the ends', () => {
    expect(gridMove(LENGTHS, 9, 'ArrowRight')).toBe(10)
    expect(gridMove(LENGTHS, 10, 'ArrowLeft')).toBe(9)
    expect(gridMove(LENGTHS, 0, 'ArrowLeft')).toBe(0)
    expect(gridMove(LENGTHS, 29, 'ArrowRight')).toBe(29)
    expect(gridMove(LENGTHS, 15, 'Home')).toBe(0)
    expect(gridMove(LENGTHS, 3, 'End')).toBe(29)
  })

  it('keeps the column going down, into the next section too', () => {
    expect(gridMove(LENGTHS, 1, 'ArrowDown')).toBe(9) // row 2 of section 1, column 1
    expect(gridMove(LENGTHS, 5, 'ArrowDown')).toBe(9) // a shorter row: its last emoji
    expect(gridMove(LENGTHS, 9, 'ArrowDown')).toBe(11) // section 2, column 1
    expect(gridMove(LENGTHS, 25, 'ArrowDown')).toBe(29) // last row of the last section
    expect(gridMove(LENGTHS, 29, 'ArrowDown')).toBe(29)
  })

  it('keeps the column going up, into the previous section, and to the search from the top', () => {
    expect(gridMove(LENGTHS, 19, 'ArrowUp')).toBe(11)
    expect(gridMove(LENGTHS, 11, 'ArrowUp')).toBe(9) // section 1's last row, column 1
    expect(gridMove(LENGTHS, 15, 'ArrowUp')).toBe(9) // column 5 there does not exist: its last
    expect(gridMove(LENGTHS, 3, 'ArrowUp')).toBe('search')
  })

  it('ignores other keys and an empty grid', () => {
    expect(gridMove(LENGTHS, 3, 'a')).toBeNull()
    expect(gridMove([], 0, 'ArrowDown')).toBeNull()
  })
})
