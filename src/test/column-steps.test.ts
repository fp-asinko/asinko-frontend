// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// specs/sidebar-fill SF-03 (PO, 2026-11-12): the column's height steps, in rem, from globals.css.
const css = readFileSync('src/app/globals.css', 'utf8')
const step = (name: string) =>
  Number(
    new RegExp(
      String.raw`@custom-variant column-${name} \(@container column \(height < ([\d.]+)rem\)\)`,
    ).exec(css)?.[1],
  )

describe('left column height steps (SF-03)', () => {
  it('starts at the minimum of 3 groups, 3 people, 3 asset rows and 1 suggestion (936px)', () => {
    expect(step('short') * 16).toBe(936)
  })

  it('adds a 4th group and person, then 5 asset rows, then the maximums', () => {
    expect(step('mid') * 16).toBe(1002)
    expect(step('tall') * 16).toBe(1250)
  })
})
