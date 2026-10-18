import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { ProfileTab } from '../schemas/profile-tab.schema'

/**
 * Theses · Posts · Replies on a person's page, as the prototype's profile (specs/profile-track-record PT-04,
 * changed with the PO on 2026-10-09): small outlined pills, the current one in black, as the
 * prototype's (12px semibold, 5px × 14px). Links, not an ARIA tab
 * widget: they navigate, can be shared and need no JavaScript. Posts is the page itself and the
 * default; Theses adds ?tab=theses.
 */
export function ProfileTabs({ pagePath, current }: { pagePath: string; current: ProfileTab }) {
  const t = useTranslations('communities.tabs')
  const tabs = [
    { tab: 'theses', href: `${pagePath}?tab=theses` },
    { tab: 'posts', href: pagePath },
    // Their comments, out of their threads (specs/backend-adoption BK-03).
    { tab: 'replies', href: `${pagePath}?tab=replies` },
  ] as const

  return (
    <nav aria-label={t('label')} className="flex gap-1.5 px-4 pt-3.5 pb-1 md:px-0">
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
              // 30px tall, 24px+ target (WCAG 2.5.8).
              'inline-flex h-7.5 tap items-center rounded-full border px-3.5 type-meta font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border-strong bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground',
            )}
          >
            {t(tab)}
          </Link>
        )
      })}
    </nav>
  )
}
