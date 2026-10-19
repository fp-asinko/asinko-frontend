'use client'

import { useFormatter, useTranslations, type DateTimeFormatOptions } from 'next-intl'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
/** The zone of who looks; on the server (and before hydrating), none: the time goes in UTC. */
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const noZone = () => null

/**
 * When an event happens (specs/community-widgets CW-06), in the zone of who looks: the server does
 * not know it, so it sends the time in UTC, saying so, and the browser writes it in its own zone
 * as soon as it can (no effect: an external store). An all-day event is a date, the same anywhere.
 */
export function LocalTime({
  startsAt,
  endsAt,
  allDay,
}: {
  startsAt: string
  endsAt: string | null
  allDay: boolean
}) {
  const format = useFormatter()
  const t = useTranslations('communities.widgets.calendar')
  const zone = useSyncExternalStore(subscribe, browserZone, noZone)
  const options: DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(allDay ? {} : { hour: 'numeric', minute: '2-digit' }),
    timeZone: allDay ? 'UTC' : (zone ?? 'UTC'),
  }
  const start = new Date(startsAt)
  const when =
    endsAt && !allDay
      ? format.dateTimeRange(start, new Date(endsAt), options)
      : format.dateTime(start, options)

  return (
    <time dateTime={startsAt} suppressHydrationWarning>
      {allDay ? t('allDayWhen', { when }) : zone ? when : t('utcWhen', { when })}
    </time>
  )
}
