export type AccuracyTier = 'high' | 'mid' | 'low'

/** Tier of an author's accuracy (FC-03, Q1): high from 70%, mid from 50%, low below. */
export function accuracyTier(rate: number): AccuracyTier {
  if (rate >= 0.7) return 'high'
  if (rate >= 0.5) return 'mid'
  return 'low'
}

/**
 * The tier's tint and text (tokens --accuracy-*): the feed's cards and the left column (FC-03). The
 * percentage stays visible next to it, so color is never the only cue.
 */
export const ACCURACY_CLASSES: Record<AccuracyTier, string> = {
  high: 'bg-accuracy-high text-accuracy-high-foreground',
  mid: 'bg-accuracy-mid text-accuracy-mid-foreground',
  low: 'bg-accuracy-low text-accuracy-low-foreground',
}
