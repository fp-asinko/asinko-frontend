import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { TimeZoneSync } from './time-zone-sync'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
const clear = () => (document.cookie = 'asinko-tz=; path=/; max-age=0')

describe('TimeZoneSync (specs/local-time LT-01, LT-03)', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(clear)

  it('writes the browser zone and refreshes once', () => {
    render(<TimeZoneSync />)
    expect(document.cookie).toContain(`asinko-tz=${encodeURIComponent(zone)}`)
    expect(router.refresh).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the cookie already holds it', () => {
    document.cookie = `asinko-tz=${encodeURIComponent(zone)}; path=/`
    render(<TimeZoneSync />)
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('replaces another zone, as after a trip', () => {
    document.cookie = 'asinko-tz=Asia%2FTokyo; path=/'
    render(<TimeZoneSync />)
    expect(router.refresh).toHaveBeenCalledTimes(zone === 'Asia/Tokyo' ? 0 : 1)
  })
})
