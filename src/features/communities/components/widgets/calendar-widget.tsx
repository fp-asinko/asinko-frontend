import { CalendarDaysIcon, MapPinIcon } from 'lucide-react'
import { useNow, useTranslations } from 'next-intl'
import type { CommunityWidget } from '../../communities.types'
import { LocalTime } from './local-time'
import { WidgetAnchor } from './widget-anchor'

type CalendarWidget = Extract<CommunityWidget, { type: 'CALENDAR' }>

/** How many upcoming events show (CW-06). */
const SHOWN = 5

/** The events not over yet, the nearest first: an event is over when its end (or start) passed. */
export function upcomingEvents(events: CalendarWidget['events'], now: number) {
  return events
    .filter(
      (event) =>
        Date.parse(event.endsAt ?? event.startsAt) >= now - (event.allDay ? 86_400_000 : 0),
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, SHOWN)
}

/**
 * The calendar (specs/community-widgets CW-06): the next five events, the nearest first, each with
 * when (in the zone of who looks), where and its link. Without one ahead, it says so.
 */
export function CalendarWidgetBody({ widget }: { widget: CalendarWidget }) {
  const t = useTranslations('communities.widgets.calendar')
  const events = upcomingEvents(widget.events, useNow().getTime())
  if (events.length === 0) {
    return <p className="type-small text-muted-foreground">{t('empty')}</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event, index) => (
        <li key={index} className="flex gap-2.5">
          <CalendarDaysIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            {event.link ? (
              <WidgetAnchor
                link={event.link}
                className="rounded-sm type-small font-bold outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {event.title}
              </WidgetAnchor>
            ) : (
              <p className="type-small font-bold">{event.title}</p>
            )}
            <p className="type-meta text-muted-foreground">
              <LocalTime startsAt={event.startsAt} endsAt={event.endsAt} allDay={event.allDay} />
            </p>
            {event.location && (
              <p className="flex items-center gap-1 type-meta text-muted-foreground">
                <MapPinIcon aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">{event.location}</span>
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
