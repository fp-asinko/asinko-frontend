'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { TIME_ZONE_COOKIE } from '@/lib/time-zone'

const YEAR_SECONDS = 365 * 24 * 60 * 60

/** The zone the cookie holds now, if any. */
function storedZone(): string | null {
  const entry = document.cookie.split('; ').find((each) => each.startsWith(`${TIME_ZONE_COOKIE}=`))
  return entry ? decodeURIComponent(entry.slice(TIME_ZONE_COOKIE.length + 1)) : null
}

/**
 * Tells the server the browser's time zone (specs/local-time LT-01, LT-03): when the cookie does
 * not hold it yet, writes it and refreshes once, so the server draws every date in it. Compares
 * with the cookie, not with what the server used: a zone the server refuses never loops.
 */
export function TimeZoneSync() {
  const router = useRouter()
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!zone || storedZone() === zone) return
    const secure = location.protocol === 'https:' ? '; secure' : ''
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(zone)}; path=/; max-age=${YEAR_SECONDS}; samesite=lax${secure}`
    router.refresh()
  }, [router])
  return null
}
