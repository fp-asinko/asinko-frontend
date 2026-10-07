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
        // A dark scrim over any banner, in both themes (as the prototype and the dialogs' overlay).
        'inline-flex h-7 tap items-center gap-1 rounded-full border border-white/20 bg-black/45 px-3 type-meta font-semibold text-white outline-none hover:bg-black/60 focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <ArrowLeftIcon aria-hidden className="size-3.5" />
      {t('back')}
    </button>
  )
}
