import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { ProfileTab } from '../schemas/profile-tab.schema'

/**
 * Theses · Posts on a person's page, as the prototype's profile (specs/profile-track-record PT-04,
 * changed with the PO on 2026-10-09): pills, the current one in black. Links, not an ARIA tab
 * widget: they navigate, can be shared and need no JavaScript. Posts is the page itself and the
 * default; Theses adds ?tab=theses.
 */
export function ProfileTabs({ pagePath, current }: { pagePath: string; current: ProfileTab }) {
  const t = useTranslations('communities.tabs')
  const tabs = [
    { tab: 'theses', href: `${pagePath}?tab=theses` },
    { tab: 'posts', href: pagePath },
  ] as const

  return (
    <nav aria-label={t('label')} className="flex gap-1.5 px-4 pt-3.5 md:px-0">
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
              'inline-flex h-8 tap items-center rounded-full px-3.5 type-action outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted-hover hover:text-foreground',
            )}
          >
            {t(tab)}
          </Link>
        )
      })}
    </nav>
  )
}
