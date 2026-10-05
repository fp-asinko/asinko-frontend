import { useNow, useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'

const LINKS = ['rules', 'privacy', 'terms', 'accessibility', 'about', 'careers', 'press'] as const

/**
 * The legal and company links of the prototype (RC-03). None of those pages exists yet: each one is
 * a "Coming soon" control (H-26), opening upwards because it sits at the end of the column.
 */
export function SiteFooter() {
  const t = useTranslations('rightColumn.footer')
  const year = useNow().getUTCFullYear()

  return (
    <footer className="border-t px-3.5 py-4">
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {LINKS.map((key) => (
          <li key={key}>
            <ComingSoon
              label={t(`links.${key}`)}
              placement="above"
              className="inline-flex min-h-6 tap items-center type-meta text-muted-foreground hover:text-foreground"
            >
              {t(`links.${key}`)}
            </ComingSoon>
          </li>
        ))}
      </ul>
      <p className="mt-3 type-meta text-muted-foreground">{t('copyright', { year })}</p>
    </footer>
  )
}
