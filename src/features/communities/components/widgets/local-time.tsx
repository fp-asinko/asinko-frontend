'use client'

import { useFormatter, useTranslations, type DateTimeFormatOptions } from 'next-intl'

/**
 * When an event happens (specs/community-widgets CW-06), in the zone of who looks: the configured
 * one, the same on the server and in the browser (specs/local-time LT-04). An all-day event is a
 * date, the same anywhere.
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
  const options: DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(allDay ? { timeZone: 'UTC' } : { hour: 'numeric', minute: '2-digit' }),
  }
  const start = new Date(startsAt)
  const when =
    endsAt && !allDay
      ? format.dateTimeRange(start, new Date(endsAt), options)
      : format.dateTime(start, options)

  // Node and the browser carry different ICU data: the same time can come with another space
  // (a narrow one before PM). Only that text: the zone is the same on both sides.
  return (
    <time dateTime={startsAt} suppressHydrationWarning>
      {allDay ? t('allDayWhen', { when }) : when}
    </time>
  )
}
