import type { ThesisTicketData } from './ticket.types'

/** The price the bar measures, and where it comes from. */
type Measured = {
  entry: number
  target: number
  price: number
  /** Today's (open) or the resolution's (closed). */
  closed: boolean
  /** When today's price is from, if the backend says it is old (TI-06); null otherwise. */
  staleAt: string | null
}

/**
 * Where a thesis stands between its entry and its target (specs/thesis-identity TI-01 to TI-07):
 * - `toward`: on its way, `share` of it done (0 ≤ share < 1) and `remaining` to go from the price.
 * - `reached`: past the target before its deadline; the backend still resolves it (TI-03).
 * - `against`: crossed the entry the other way; `change` from the entry (TI-04).
 */
export type ThesisProgress = Measured &
  (
    | { kind: 'toward'; share: number; remaining: number }
    | { kind: 'reached' }
    | { kind: 'against'; change: number }
  )

/**
 * null when there is nothing to measure (TI-05 to TI-07): no target, a target "at" a price, no
 * entry, no price to compare, or closed without a resolution's price (cancelled, expired,
 * disputed). The same sum for both directions: below, the target is under the entry and the sign
 * turns by itself.
 */
export function thesisProgress(ticket: ThesisTicketData): ThesisProgress | null {
  const { target, reference, current, resolution, state } = ticket
  if (!target || target.direction === 'equals' || !reference || reference.price <= 0) return null
  if (target.price === reference.price) return null

  const open = state === 'open'
  const resolved = state === 'correct' || state === 'incorrect'
  const price = open ? (current?.price ?? null) : resolved ? (resolution?.price ?? null) : null
  if (price === null || price <= 0) return null

  const measured: Measured = {
    entry: reference.price,
    target: target.price,
    price,
    closed: !open,
    staleAt: open && current?.stale ? current.at : null,
  }
  const share = (price - reference.price) / (target.price - reference.price)
  if (share >= 1) return { ...measured, kind: 'reached' }
  if (share < 0)
    return { ...measured, kind: 'against', change: (price - reference.price) / reference.price }
  return { ...measured, kind: 'toward', share, remaining: Math.abs(target.price - price) / price }
}
