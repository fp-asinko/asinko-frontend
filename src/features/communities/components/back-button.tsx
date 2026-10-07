'use client'

import { ArrowLeftIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

/**
 * "Back" over the banner, as the prototype: to the previous page when the visit came from the
 * site, to the Home when the page was opened directly (a shared link).
 */
export function BackButton({ className }: { className?: string }) {
  const t = useTranslations('communities.actions')
  const router = useRouter()

  function back() {
    const fromSite = document.referrer && new URL(document.referrer).origin === location.origin
    if (fromSite && history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <button
      type="button"
      onClick={back}
      className={cn(
        'inline-flex h-8 tap items-center gap-1.5 rounded-full bg-background/90 px-3 type-action outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <ArrowLeftIcon aria-hidden className="size-4" />
      {t('back')}
    </button>
  )
}
