// Deterministic ids and timestamps, so fixtures and tests never change between runs.

/** Valid v4-shaped UUID from a number: ns 1 users · 2 communities · 3 assets · 4 posts · 5 polls · 6 comments · 7 poll options. */
export function mockId(namespace: number, n: number): string {
  return `00000000-0000-4000-8000-${String(namespace * 1000 + n).padStart(12, '0')}`
}

/** Fixed "now" for the mock world. */
export const MOCK_NOW = Date.parse('2026-10-01T12:00:00Z')

export function minutesAgo(minutes: number): string {
  return new Date(MOCK_NOW - minutes * 60_000).toISOString()
}

export const hoursAgo = (hours: number) => minutesAgo(hours * 60)
export const daysAgo = (days: number) => minutesAgo(days * 24 * 60)
