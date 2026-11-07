// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// specs/content-reveal: the utility is CSS only; read from globals.css as written.
const css = readFileSync(path.resolve(import.meta.dirname, '../app/globals.css'), 'utf8')
const utility = css.match(/@utility arrive \{([\s\S]*?)\n\}/)?.[1] ?? ''

describe('arrive (specs/content-reveal CR-01, CR-04)', () => {
  it('has no box of its own, so the layout does not change', () => {
    expect(utility).toMatch(/display:\s*contents;/)
  })

  it('fades its children in with the fade-in token: only opacity', () => {
    expect(utility).toMatch(/& > \*\s*\{\s*animation: var\(--animate-fade-in\);/)
    expect(css).toMatch(/--animate-fade-in: fade-in 200ms var\(--ease-out\);/)
    const keyframes = css.match(/@keyframes fade-in \{([\s\S]*?)\n {2}\}/)?.[1] ?? ''
    expect(keyframes).toContain('opacity: 0')
    expect(keyframes).not.toContain('transform')
  })
})
