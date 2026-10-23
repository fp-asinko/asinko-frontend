import { afterEach, describe, expect, it } from 'vitest'
import { siteFolded, submitOpen, writeLeftColumnCookie } from './left-column'

describe('left column cookies (specs/sidebar-toggle § 1)', () => {
  afterEach(() => {
    document.cookie = 'asinko-left-column=; path=/; max-age=0'
  })

  it('reads only the exact value; anything else is the default', () => {
    expect(siteFolded('folded')).toBe(true)
    for (const value of [undefined, 'open', 'FOLDED', '']) expect(siteFolded(value)).toBe(false)
    expect(submitOpen('open')).toBe(true)
    for (const value of [undefined, 'folded', 'yes']) expect(submitOpen(value)).toBe(false)
  })

  it('writes it for the whole site', () => {
    writeLeftColumnCookie('asinko-left-column', 'folded')
    expect(document.cookie).toContain('asinko-left-column=folded')
  })
})
