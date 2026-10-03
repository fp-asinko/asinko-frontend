export type AccuracyTier = 'high' | 'mid' | 'low'

/** Tier of an author's accuracy (FC-03, Q1): high from 70%, mid from 50%, low below. */
export function accuracyTier(rate: number): AccuracyTier {
  if (rate >= 0.7) return 'high'
  if (rate >= 0.5) return 'mid'
  return 'low'
}
