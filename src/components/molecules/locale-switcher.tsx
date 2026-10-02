'use client'

import { GlobeIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

/**
 * Language selector of the top bar (H-27). A native <select> laid transparently over a visible
 * label (globe + code): keyboard, screen readers and the system picker on mobile for free, and no
 * dependencies. Switches to the same page in the other locale, keeping the URL filters.
 */
export function LocaleSwitcher() {
  const t = useTranslations('common.locale')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onChange(next: Locale) {
    startTransition(() => {
      router.replace(`${pathname}${window.location.search}`, { locale: next })
    })
  }

  return (
    <span className="relative inline-flex h-10 items-center gap-1 rounded-full px-2.5 type-action text-muted-foreground has-[select:focus-visible]:ring-3 has-[select:focus-visible]:ring-ring/50 has-[select:hover]:bg-surface">
      <GlobeIcon aria-hidden className="size-4" />
      <span aria-hidden className="uppercase">
        {locale}
      </span>
      <select
        aria-label={t('label')}
        value={locale}
        disabled={pending}
        onChange={(event) => onChange(event.target.value as Locale)}
        className="absolute inset-0 cursor-pointer appearance-none rounded-full text-base opacity-0"
      >
        {routing.locales.map((each) => (
          // lang: each name is read in its own language (WCAG 3.1.2).
          <option key={each} value={each} lang={each}>
            {t(`names.${each}`)}
          </option>
        ))}
      </select>
    </span>
  )
}
