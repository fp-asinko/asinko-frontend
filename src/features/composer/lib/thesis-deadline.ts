/**
 * A thesis's deadline (specs/thesis-create Q4): a day, closing at 23:59:59 in the writer's time
 * zone. Built in the browser, the only side that knows the zone; the backend takes it between 24
 * hours and 5 years from now (asinko-app lib/api/theses.ts).
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** The backend's range (DEADLINE_MIN_MS and DEADLINE_MAX_MS). */
export const DEADLINE_MIN_MS = DAY_MS
export const DEADLINE_MAX_MS = 5 * 365 * DAY_MS

/** A day as the date field holds it: YYYY-MM-DD. */
export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const pad = (value: number) => String(value).padStart(2, '0')

/** A date's local day, as YYYY-MM-DD. */
function dayOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The end of a day (YYYY-MM-DD) in the local zone, as an ISO instant; null for a day that does not exist. */
export function deadlineAt(day: string): string | null {
  if (!DAY_PATTERN.test(day)) return null
  const [year, month, date] = day.split('-').map(Number) as [number, number, number]
  const end = new Date(year, month - 1, date, 23, 59, 59)
  // 2026-02-30 would roll over to March: not a day.
  if (end.getFullYear() !== year || end.getMonth() !== month - 1 || end.getDate() !== date) {
    return null
  }
  return end.toISOString()
}

/**
 * The days the field offers (TC-06): from tomorrow, whose end is always more than 24 hours away,
 * to the day before 5 years from now, whose end never passes the backend's limit.
 */
export function thesisDeadlineRange(now: Date): { min: string; max: string } {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const last = new Date(now.getTime() + DEADLINE_MAX_MS)
  const max = new Date(last.getFullYear(), last.getMonth(), last.getDate() - 1)
  return { min: dayOf(tomorrow), max: dayOf(max) }
}

/** The backend's rule, before the network: a page left open overnight may hold a stale day. */
export function isDeadlineInRange(iso: string, now: Date): boolean {
  const delta = new Date(iso).getTime() - now.getTime()
  return delta >= DEADLINE_MIN_MS && delta <= DEADLINE_MAX_MS
}

/** The deadline shortcuts (specs/thesis-create TC-33). */
export const QUICK_DEADLINES = ['month1', 'month3', 'month6', 'year1', 'yearEnd'] as const
export type QuickDeadline = (typeof QUICK_DEADLINES)[number]

/**
 * The day of each shortcut from `now`, in the local calendar: months added to the date (31 Jan + 1
 * month is the last of February), the end of the year is 31 Dec. One outside the range the backend
 * takes (the end of the year less than a day away) is left out.
 */
export function quickDeadlines(now: Date): { key: QuickDeadline; day: string }[] {
  const { min, max } = thesisDeadlineRange(now)
  const plusMonths = (months: number) => {
    const target = new Date(now.getFullYear(), now.getMonth() + months, 1)
    const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
    return dayOf(new Date(target.getFullYear(), target.getMonth(), Math.min(now.getDate(), last)))
  }
  const days: Record<QuickDeadline, string> = {
    month1: plusMonths(1),
    month3: plusMonths(3),
    month6: plusMonths(6),
    year1: plusMonths(12),
    yearEnd: `${now.getFullYear()}-12-31`,
  }
  return QUICK_DEADLINES.map((key) => ({ key, day: days[key] })).filter(
    ({ day }) => day >= min && day <= max,
  )
}
