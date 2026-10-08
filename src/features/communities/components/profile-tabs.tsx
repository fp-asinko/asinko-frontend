import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { ProfileTab } from '../schemas/profile-tab.schema'

/**
 * Posts · Theses on a person's page, as X's profile tabs (specs/profile-track-record PT-04),
 * underlined like the feed's. Links, not an ARIA tab widget: they navigate, can be shared and need
 * no JavaScript. Posts is the page itself; Theses adds ?tab=theses.
 */
export function ProfileTabs({ pagePath, current }: { pagePath: string; current: ProfileTab }) {
  const t = useTranslations('communities.tabs')
  const tabs = [
    { tab: 'posts', href: pagePath },
    { tab: 'theses', href: `${pagePath}?tab=theses` },
  ] as const

  return (
    <nav aria-label={t('label')} className="mt-3.5 flex border-b">
      {tabs.map(({ tab, href }) => {
        const active = current === tab
        return (
          <Link
            key={tab}
            href={href}
            // Switching tab keeps the place: the header stays where it is.
            scroll={false}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-11 flex-1 items-center justify-center px-4 type-ui font-semibold transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-none',
              active
                ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:animate-underline-in after:bg-foreground after:content-['']"
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(tab)}
          </Link>
        )
      })}
    </nav>
  )
}
