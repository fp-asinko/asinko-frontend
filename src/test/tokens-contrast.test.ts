// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// F-17 / D-01: every text/background pair of the theme meets WCAG AA (4.5:1 text, 3:1 non-text),
// in light and dark. Reads the real tokens from globals.css.
const css = readFileSync(path.resolve(import.meta.dirname, '../app/globals.css'), 'utf8')

type Rgba = [number, number, number, number]

function readBlock(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf('}', start))
  const vars: Record<string, string> = {}
  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    vars[match[1] as string] = (match[2] as string).replace(/\/\*.*?\*\//g, '').trim()
  }
  return vars
}

const light = readBlock(':root')
const THEMES = { light, dark: { ...light, ...readBlock('.dark') } }

function resolve(theme: Record<string, string>, token: string): string {
  let value = theme[token]
  for (let depth = 0; value?.startsWith('var(') && depth < 10; depth++) {
    value = theme[value.slice(6, -1)]
  }
  if (!value) throw new Error(`Unknown token --${token}`)
  return value
}

function parseColor(value: string): Rgba {
  const hex = /^#([0-9a-f]{6})$/i.exec(value)
  if (hex) {
    const n = parseInt(hex[1] as string, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(value)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), Number(rgb[4] ?? 1)]
  throw new Error(`Unsupported color format: ${value}`)
}

function composite([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1]
}

function luminance([r, g, b]: Rgba): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(theme: Record<string, string>, fg: string, bg: string): number {
  const background = parseColor(resolve(theme, bg))
  const foreground = composite(parseColor(resolve(theme, fg)), background)
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return ((light as number) + 0.05) / ((dark as number) + 0.05)
}

const TEXT_PAIRS: Array<[string, string]> = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'muted'],
  ['primary', 'background'],
  ['primary', 'card'],
  ['primary', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['destructive', 'card'],
  ['destructive', 'popover'],
  ['success', 'background'],
  ['success', 'card'],
  ['bearish', 'card'],
  ['warning', 'card'],
  ['sidebar-foreground', 'sidebar'],
]

const NON_TEXT_PAIRS: Array<[string, string]> = [
  ['ring', 'background'],
  ['ring', 'card'],
  ['tint', 'card'],
  ['input', 'card'],
]

describe.each(Object.entries(THEMES))('%s theme tokens', (_name, theme) => {
  it.each(TEXT_PAIRS)('text --%s on --%s reaches 4.5:1', (fg, bg) => {
    expect(contrast(theme, fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(NON_TEXT_PAIRS)('UI --%s on --%s reaches 3:1', (fg, bg) => {
    expect(contrast(theme, fg, bg)).toBeGreaterThanOrEqual(3)
  })
})
