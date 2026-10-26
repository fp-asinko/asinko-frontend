/**
 * The geometry of a poll's 3D pie (specs/poll-pie § 2): a tilted disc with depth, one slice per
 * option with votes. Pure functions: the component only draws the paths.
 */

/** The disc seen tilted: its height over its width, and its depth over its radius. */
export const TILT = 0.6
export const DEPTH = 0.18

/**
 * The identity hue of each place, the most voted first (PP-02, PO 2026-10-26: soft colors): far
 * apart from one another, so neighbors read apart (--avatar-0 … 7).
 */
const PALETTE = [0, 6, 2, 4, 3, 7, 1, 5]

export type PieSlice = {
  id: string
  /** Its identity hue (0 to 7), by its place in the votes; each slice its own, ties too. */
  color: number
  /** Top face. */
  top: string
  /** The front side, when the slice reaches the front half; null otherwise. */
  side: string | null
  /** Middle angle, to move it outwards when highlighted. */
  mid: number
}

type Point = { x: number; y: number }

/**
 * The hue of each option by its place in the votes. A tie keeps the options' order: two slices side
 * by side in the same color would read as one. No votes, no color.
 */
export function pieColors(options: readonly { id: string; share: number | null }[]) {
  // sort is stable: a tie keeps the options' order.
  const ranked = options
    .filter((option) => (option.share ?? 0) > 0)
    .sort((a, b) => (b.share ?? 0) - (a.share ?? 0))
  return new Map(
    ranked.map((option, place) => [option.id, PALETTE[place % PALETTE.length]!] as const),
  )
}

/**
 * The slices of a pie of radius `r` centered at (`cx`, `cy`), from the top clockwise, each one as
 * wide as its share. Options without votes are left out.
 */
export function pieSlices(
  options: readonly { id: string; share: number | null }[],
  { cx, cy, r }: { cx: number; cy: number; r: number },
): PieSlice[] {
  const ry = r * TILT
  const depth = r * DEPTH
  const colors = pieColors(options)
  const total = options.reduce((sum, option) => sum + Math.max(0, option.share ?? 0), 0)
  if (total <= 0) return []

  const at = (angle: number, down = 0): Point => ({
    x: round(cx + r * Math.cos(angle)),
    y: round(cy + ry * Math.sin(angle) + down),
  })
  const arc = (to: Point, large: boolean, sweep: 0 | 1) =>
    `A ${r} ${round(ry)} 0 ${large ? 1 : 0} ${sweep} ${to.x} ${to.y}`

  let start = -Math.PI / 2
  return options.flatMap((option) => {
    const share = Math.max(0, option.share ?? 0) / total
    if (share <= 0) return []
    const end = start + share * Math.PI * 2
    const slice: PieSlice = {
      id: option.id,
      color: colors.get(option.id)!,
      top: share >= 0.9999 ? fullEllipse(cx, cy, r, ry) : topFace(at, arc, cx, cy, start, end),
      side: frontSide(at, arc, start, end, depth),
      mid: (start + end) / 2,
    }
    start = end
    return [slice]
  })
}

function topFace(
  at: (angle: number) => Point,
  arc: (to: Point, large: boolean, sweep: 0 | 1) => string,
  cx: number,
  cy: number,
  from: number,
  to: number,
) {
  const a = at(from)
  return `M ${round(cx)} ${round(cy)} L ${a.x} ${a.y} ${arc(at(to), to - from > Math.PI, 1)} Z`
}

/** The visible side of a slice: the part of it in the front half, from 0 to 180 degrees. */
function frontSide(
  at: (angle: number, down?: number) => Point,
  arc: (to: Point, large: boolean, sweep: 0 | 1) => string,
  from: number,
  to: number,
  depth: number,
) {
  const s = Math.max(from, 0)
  const e = Math.min(to, Math.PI)
  if (e <= s) return null
  const a = at(s)
  const b = at(e)
  const bDown = at(e, depth)
  const aDown = at(s, depth)
  return `M ${a.x} ${a.y} ${arc(b, false, 1)} L ${bDown.x} ${bDown.y} ${arc(aDown, false, 0)} Z`
}

function fullEllipse(cx: number, cy: number, r: number, ry: number) {
  const y = round(ry)
  return `M ${round(cx - r)} ${round(cy)} A ${r} ${y} 0 1 1 ${round(cx + r)} ${round(cy)} A ${r} ${y} 0 1 1 ${round(cx - r)} ${round(cy)} Z`
}

function round(value: number) {
  return Math.round(value * 100) / 100
}
