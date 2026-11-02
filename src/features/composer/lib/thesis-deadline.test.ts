// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  DEADLINE_MAX_MS,
  deadlineAt,
  isDeadlineInRange,
  quickDeadlines,
  thesisDeadlineRange,
} from './thesis-deadline'

describe('deadlineAt (specs/thesis-create Q4)', () => {
  it('is the end of the day in the local zone', () => {
    const end = new Date(deadlineAt('2026-12-31')!)
    expect([end.getFullYear(), end.getMonth(), end.getDate()]).toEqual([2026, 11, 31])
    expect([end.getHours(), end.getMinutes(), end.getSeconds()]).toEqual([23, 59, 59])
  })

  it('takes a leap day, and refuses a day that does not exist or another shape', () => {
    expect(deadlineAt('2028-02-29')).not.toBeNull()
    expect(deadlineAt('2027-02-29')).toBeNull()
    expect(deadlineAt('2026-13-01')).toBeNull()
    expect(deadlineAt('31/12/2026')).toBeNull()
    expect(deadlineAt('')).toBeNull()
  })
})

describe('thesisDeadlineRange (TC-06)', () => {
  it('goes from tomorrow to the day before 5 years from now', () => {
    expect(thesisDeadlineRange(new Date(2026, 10, 2, 10, 0))).toEqual({
      min: '2026-11-03',
      max: '2031-10-31',
    })
  })

  it('starts tomorrow even a minute before midnight, and crosses the month and the year', () => {
    expect(thesisDeadlineRange(new Date(2026, 11, 31, 23, 59)).min).toBe('2027-01-01')
  })

  it('offers only days the backend takes, at both ends', () => {
    for (const now of [new Date(2026, 10, 2, 0, 0), new Date(2026, 10, 2, 23, 59, 59)]) {
      const { min, max } = thesisDeadlineRange(now)
      expect(isDeadlineInRange(deadlineAt(min)!, now)).toBe(true)
      expect(isDeadlineInRange(deadlineAt(max)!, now)).toBe(true)
    }
  })
})

describe('isDeadlineInRange (the backend rule)', () => {
  const now = new Date('2026-11-02T12:00:00Z')
  const at = (ms: number) => new Date(now.getTime() + ms).toISOString()

  it('takes from 24 hours to 5 years', () => {
    expect(isDeadlineInRange(at(24 * 60 * 60 * 1000), now)).toBe(true)
    expect(isDeadlineInRange(at(DEADLINE_MAX_MS), now)).toBe(true)
  })

  it('refuses less than 24 hours, more than 5 years, and the past', () => {
    expect(isDeadlineInRange(at(24 * 60 * 60 * 1000 - 1), now)).toBe(false)
    expect(isDeadlineInRange(at(DEADLINE_MAX_MS + 1), now)).toBe(false)
    expect(isDeadlineInRange(at(-1000), now)).toBe(false)
  })
})

describe('quickDeadlines (TC-33)', () => {
  it('adds months in the local calendar, and ends the year on 31 Dec', () => {
    expect(quickDeadlines(new Date(2026, 10, 2, 10))).toEqual([
      { key: 'month1', day: '2026-12-02' },
      { key: 'month3', day: '2027-02-02' },
      { key: 'month6', day: '2027-05-02' },
      { key: 'year1', day: '2027-11-02' },
      { key: 'yearEnd', day: '2026-12-31' },
    ])
  })

  it('keeps the end of a shorter month', () => {
    expect(quickDeadlines(new Date(2027, 0, 31, 10))[0]).toEqual({
      key: 'month1',
      day: '2027-02-28',
    })
  })

  it('leaves out the end of the year when it is not a day away', () => {
    const keys = quickDeadlines(new Date(2026, 11, 31, 9)).map((each) => each.key)
    expect(keys).not.toContain('yearEnd')
    expect(keys).toContain('month1')
  })
})
