/** Where a thesis stands (E11 `ThesisState`, in lower case). */
export type ThesisTicketState =
  'open' | 'correct' | 'incorrect' | 'expired' | 'disputed' | 'cancelled'

/** What the ticket draws (specs/thesis-ticket § 4): no business, only what each card has. */
export type ThesisTicketData = {
  id: string
  /** null for a qualitative thesis: no asset, no target (TK-08). */
  asset: { symbol: string; name: string; path: string; logoUrl: string | null } | null
  target: { direction: 'above' | 'below' | 'equals'; price: number } | null
  /** The price when it was published, and when. */
  reference: { price: number; at: string | null } | null
  deadline: string
  /** LOW … EXTREME as 1 … 4 bars. */
  conviction: 1 | 2 | 3 | 4
  state: ThesisTicketState
  resolution: {
    price: number | null
    at: string
    source: 'automatic' | 'community' | 'admin' | null
  } | null
  cancellation: { at: string; reason: string | null } | null
}
