import { BellIcon, CirclePlusIcon, SearchIcon, UserIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { NavLink } from '@/components/molecules/nav-link'
import { GatedComingSoon } from '@/components/organisms/auth-gate'
import { ComposeTrigger } from '@/components/organisms/compose'
import { cn } from '@/lib/utils'
import type { NavItem } from './nav-item.types'

const CREATE_ITEM =
  'flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-2 type-meta text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

const SOON_ITEM =
  'flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-2 type-meta text-muted-foreground'

/*
 * Mobile only (< md), five items as in the prototype (Home · Search · Create · Notif · Profile).
 * Only the registered destinations work; the rest are shown disabled (H-26). Create opens the
 * post editor (specs/post-create-detail PC-02). Profile takes you to your own page, or without a
 * session opens the log-in modal (specs/header-refresh HR-02).
 */
export function BottomNav({
  items,
  profileHref = null,
}: {
  items: NavItem[]
  profileHref?: string | null
}) {
  const t = useTranslations('common.nav')
  const soon = (label: string, icon: ReactNode) => (
    <li>
      {/* At the bottom of the screen the bubble opens upwards. */}
      <ComingSoon label={label} className={SOON_ITEM} placement="above">
        <span aria-hidden className="[&_svg]:size-6">
          {icon}
        </span>
        <span aria-hidden>{label}</span>
      </ComingSoon>
    </li>
  )

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
        {soon(t('search'), <SearchIcon />)}
        <li>
          <ComposeTrigger className={cn(CREATE_ITEM, 'tap')}>
            <CirclePlusIcon aria-hidden className="size-6" />
            {t('create')}
          </ComposeTrigger>
        </li>
        {soon(t('notificationsShort'), <BellIcon />)}
        <li>
          {profileHref ? (
            <NavLink href={profileHref} label={t('profile')} icon={<UserIcon />} variant="bar" />
          ) : (
            <GatedComingSoon action="login" label={t('profile')} className={cn(CREATE_ITEM, 'tap')}>
              <UserIcon aria-hidden className="size-6" />
              <span aria-hidden>{t('profile')}</span>
            </GatedComingSoon>
          )}
        </li>
      </ul>
    </nav>
  )
}
