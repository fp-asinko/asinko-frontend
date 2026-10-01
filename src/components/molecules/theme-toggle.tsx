'use client'

import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { Switch } from '@/components/ui/switch'

const subscribeNoop = () => () => {}

/** True only after hydration: the stored theme is unknown on the server. */
function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
}

export function ThemeToggle() {
  const t = useTranslations('common.theme')
  const { resolvedTheme, setTheme } = useTheme()
  const isClient = useIsClient()

  // Same footprint before hydration, so the header does not shift (CLS).
  if (!isClient) return <span aria-hidden className="inline-block h-[18.4px] w-8" />

  return (
    <Switch
      aria-label={t('toggle')}
      checked={resolvedTheme === 'dark'}
      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
    />
  )
}
