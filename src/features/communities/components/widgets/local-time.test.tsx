import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { LocalTime } from './local-time'
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('LocalTime (specs/community-widgets CW-06)', () => {
  it('writes when, from start to end, in the zone of who looks', () => {
    renderWithIntl(
      <LocalTime
        startsAt="2026-10-21T21:00:00.000Z"
        endsAt="2026-10-21T22:00:00.000Z"
        allDay={false}
      />,
    )
    const time = screen.getByText(/Oct 21/)
    expect(time).toHaveAttribute('dateTime', '2026-10-21T21:00:00.000Z')
    expect(time.textContent).toMatch(/–/)
  })

  it('uses the zone of who looks, from the configuration (specs/local-time LT-04)', () => {
    renderWithIntl(<LocalTime startsAt="2026-10-21T21:00:00.000Z" endsAt={null} allDay={false} />, {
      timeZone: 'America/Santiago',
    })
    expect(screen.getByText(/Oct 21.*6:00/)).toBeInTheDocument()
  })

  it('an all-day event is its date, the same anywhere', () => {
    renderWithIntl(<LocalTime startsAt="2026-10-28T00:00:00.000Z" endsAt={null} allDay />, {
      timeZone: 'America/Santiago',
    })
    expect(screen.getByText(/Oct 28 · All day/)).toBeInTheDocument()
  })
})
