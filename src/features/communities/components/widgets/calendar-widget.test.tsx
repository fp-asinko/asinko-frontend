import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { CalendarWidgetBody, upcomingEvents } from './calendar-widget'
import { CALENDAR } from './widgets.fixture'
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const NOW = new Date('2026-10-19T12:00:00.000Z')

describe('CalendarWidgetBody (specs/community-widgets CW-06)', () => {
  it('shows the upcoming ones, the nearest first, with where and its link', () => {
    renderWithIntl(<CalendarWidgetBody widget={CALENDAR} />, { now: NOW })
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Flows review')
    expect(items[0]).toHaveTextContent('Asinko Live')
    expect(items[1]).toHaveTextContent('All day')
    expect(within(items[1]!).getByRole('link', { name: /FOMC decision/ })).toHaveAttribute(
      'target',
      '_blank',
    )
  })

  it('says so without upcoming events', () => {
    renderWithIntl(<CalendarWidgetBody widget={{ ...CALENDAR, events: [CALENDAR.events[2]!] }} />, {
      now: NOW,
    })
    expect(screen.getByText('No upcoming events')).toBeInTheDocument()
  })

  it('keeps an all-day event through its day, and five at most', () => {
    const day = { ...CALENDAR.events[1]!, startsAt: '2026-10-19T00:00:00.000Z' }
    expect(upcomingEvents([day], NOW.getTime())).toHaveLength(1)
    const many = Array.from({ length: 8 }, (_, n) => ({
      ...CALENDAR.events[0]!,
      startsAt: `2026-11-0${n + 1}T10:00:00.000Z`,
      endsAt: null,
    }))
    expect(upcomingEvents(many, NOW.getTime())).toHaveLength(5)
  })
})
