import { useTranslations } from 'next-intl'
import { NavLink } from '@/components/molecules/nav-link'
import type { NavItem } from './nav-item.types'

// Mobile only (< md). Translucent, above the iPhone home indicator (safe area).
export function BottomNav({ items }: { items: NavItem[] }) {
  const t = useTranslations('common.nav')

  return (
    <nav
      aria-label={t('main')}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden reduced-transparency:bg-card reduced-transparency:backdrop-blur-none"
    >
      <ul className="flex items-center justify-around px-2 py-1">
        {items.map((item) => (
          <li key={item.href}>
            <NavLink {...item} variant="bar" />
          </li>
        ))}
      </ul>
    </nav>
  )
}
