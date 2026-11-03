/** Where a thesis stands (E11 `ThesisState`, in lower case). */
export type ThesisStateName =
  'open' | 'correct' | 'incorrect' | 'expired' | 'disputed' | 'cancelled'

/** What the summary of a thesis draws: no business, only what each card already has. */
export type ThesisSummaryData = {
  claim: string
  state: ThesisStateName
  /** What it bets on; null for a qualitative thesis (no asset, no price). */
  target: { direction: 'above' | 'below' | 'equals'; price: number } | null
  deadline: string
  /** LOW … EXTREME as 1 … 4 bars. */
  conviction: 1 | 2 | 3 | 4
  resolutionPrice: number | null
  cancellationReason: string | null
}
