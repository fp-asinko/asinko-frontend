import 'server-only'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

type ShareFont = { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }

const FONTS = join(process.cwd(), 'src/assets/fonts')
let fonts: Promise<ShareFont[]> | undefined

/**
 * Figtree for ImageResponse (SP-03): TTF, since it does not read the WOFF2 that next/font serves.
 * Read once per server.
 */
export function shareFonts(): Promise<ShareFont[]> {
  fonts ??= Promise.all(
    ([400, 700] as const).map(async (weight) => ({
      name: 'Figtree',
      data: await readFile(
        join(FONTS, weight === 700 ? 'Figtree-Bold.ttf' : 'Figtree-Regular.ttf'),
      ),
      weight,
      style: 'normal' as const,
    })),
  )
  return fonts
}

/**
 * A title for a fixed box (SP-01): at most `max` characters, cut at a word with "…". The image
 * cannot measure lines before drawing, so the cut is by length.
 */
export function clampTitle(title: string, max = 110): string {
  const text = title.trim().replace(/\s+/g, ' ')
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s.,;:!?-]+$/, '')}…`
}
