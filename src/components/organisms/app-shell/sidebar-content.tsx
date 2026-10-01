import { useTranslations } from 'next-intl'
import { NavLink } from '@/components/molecules/nav-link'
import type { NavItem } from './nav-item.types'

// Shared by the fixed desktop column and the mobile panel. The communities label is a <p>, not a
// heading: the sidebar comes before the page's h1 in the DOM (the region already has its name).
export function SidebarContent({ navItems }: { navItems: NavItem[] }) {
  const t = useTranslations('common')

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label={t('nav.main')}>
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink {...item} variant="list" />
            </li>
          ))}
        </ul>
      </nav>
      <section aria-label={t('communities.title')} className="flex flex-col gap-2 px-3">
        <p aria-hidden className="text-footnote font-semibold text-muted-foreground uppercase">
          {t('communities.title')}
        </p>
        <p className="text-subhead text-muted-foreground">{t('communities.empty')}</p>
      </section>
    </div>
  )
}
