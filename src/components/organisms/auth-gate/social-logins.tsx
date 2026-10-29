'use client'

import { useLocale, useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { GoogleMark, RedditMark } from '@/components/ui/brand-marks'
import { usePathname } from '@/i18n/navigation'

const PILL =
  'flex h-11 w-full tap items-center justify-center gap-2.5 rounded-full border bg-background type-ui font-semibold hover:bg-muted'

/**
 * Google and Reddit (specs/auth AU-10, AU-12): Google is a plain link to our Route Handler, so it
 * works without JavaScript and comes back to `next` (this page by default); Reddit is "Coming soon"
 * (MVP-206). Shared by the modal, the login page and the Join card.
 */
export function SocialLogins({ next }: { next?: string }) {
  const t = useTranslations('authGate')
  const locale = useLocale()
  const pathname = usePathname()
  const back = next ?? `/${locale}${pathname === '/' ? '' : pathname}`
  const google = t('continueWith', { provider: 'Google' })

  return (
    // Column flex: stretches the coming-soon wrapper (and its button) to the full width.
    <div className="flex flex-col gap-2">
      {/* A Route Handler, not a page: a plain anchor, not the localized Link. */}
      <a href={`/auth/google?next=${encodeURIComponent(back)}`} className={PILL}>
        <GoogleMark className="size-4.5 shrink-0" />
        {google}
      </a>
      <ComingSoon label={t('continueWith', { provider: 'Reddit' })} className={PILL}>
        <RedditMark className="size-4.5 shrink-0" />
        {t('continueWith', { provider: 'Reddit' })}
      </ComingSoon>
    </div>
  )
}
