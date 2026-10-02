import { BellIcon, CirclePlusIcon, SearchIcon, UserIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { NavLink } from '@/components/molecules/nav-link'
import type { NavItem } from './nav-item.types'

const SOON_ITEM =
  'flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-2 type-meta text-muted-foreground'

/*
 * Mobile only (< md), five items as in the prototype (Home · Search · Create · Notif · Profile).
 * Only the registered destinations work; the rest are shown disabled (H-26).
 */
export function BottomNav({ items }: { items: NavItem[] }) {
  const t = useTranslations('common.nav')
  const soon = [
    { label: t('search'), icon: <SearchIcon /> },
    { label: t('create'), icon: <CirclePlusIcon /> },
    { label: t('notificationsShort'), icon: <BellIcon /> },
    { label: t('profile'), icon: <UserIcon /> },
  ]

  return (
    <nav
      aria-label={t('main')}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-header/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden reduced-transparency:bg-header reduced-transparency:backdrop-blur-none"
    >
      <ul className="flex items-center justify-around px-1 py-1">
        {items.map((item) => (
          <li key={item.href}>
            <NavLink {...item} variant="bar" />
          </li>
        ))}
        {soon.map((item, index) => (
          <li key={item.label}>
            {/* At the bottom of the screen the bubble opens upwards; the last one aligns right. */}
            <ComingSoon
              label={item.label}
              className={SOON_ITEM}
              placement={index === soon.length - 1 ? 'above-end' : 'above'}
            >
              <span aria-hidden className="[&_svg]:size-6">
                {item.icon}
              </span>
              <span aria-hidden>{item.label}</span>
            </ComingSoon>
          </li>
        ))}
      </ul>
    </nav>
  )
}
