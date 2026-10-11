// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SHARE_COLORS, SHARE_IDENTITY } from './colors'

// The light theme: the first :root block of globals.css.
const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')))
const token = (name: string) =>
  root.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]?.toLowerCase()

describe('share image colors (specs/share-preview SP-03)', () => {
  it('are the light theme tokens of globals.css', () => {
    expect({
      background: token('background'),
      foreground: token('foreground'),
      mutedForeground: token('muted-foreground'),
      surface: token('surface'),
      border: token('border'),
      brandDot: token('brand-dot'),
      avatarForeground: token('avatar-foreground'),
    }).toEqual(SHARE_COLORS)
  })

  it('carry the eight identity hues', () => {
    expect(SHARE_IDENTITY.map((_, i) => [token(`avatar-${i}`), token(`avatar-${i}-to`)])).toEqual(
      SHARE_IDENTITY.map((pair) => [...pair]),
    )
  })
})
