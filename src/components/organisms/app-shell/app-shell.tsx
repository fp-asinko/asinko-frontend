import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { BottomNav } from './bottom-nav'
import { MobileSidebar } from './mobile-sidebar'
import type { NavItem } from './nav-item.types'
import { SiteHeader } from './site-header'

/*
 * Layout of the prototype (specs/home/design.md §3), mobile first:
 * < md: 1 column, left column in the menu panel, bottom bar
 * md: left 260px + center · lg: left 260px + center (max 780px) + right 300px
 * The left column's content comes from the layout (organisms do not know the business).
 */
export function AppShell({
  navItems,
  sidebar,
  children,
}: {
  navItems: NavItem[]
  sidebar: ReactNode
  children: ReactNode
}) {
  const t = useTranslations('common')

  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-lg bg-background px-4 py-3 type-ui font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-3 focus:ring-ring/50"
      >
        {t('nav.skipToContent')}
      </a>
      <SiteHeader menu={<MobileSidebar>{sidebar}</MobileSidebar>} />
      <div className="md:grid md:grid-cols-[16.25rem_minmax(0,1fr)] lg:grid-cols-[16.25rem_minmax(0,1fr)_18.75rem]">
        <div className="sticky top-15 hidden h-[calc(100dvh-3.75rem)] overflow-y-auto border-r px-2 py-2.5 md:block">
          {sidebar}
        </div>
        {/* outline-none: focused only by the skip link (tabIndex -1), never reachable with Tab. */}
        <main
          id="content"
          tabIndex={-1}
          className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none sm:px-4 sm:pt-4 md:pb-8"
        >
          {children}
        </main>
        {/* Right column: empty in the MVP (Q2). A div, not an aside: no empty landmark. */}
        <div className="hidden border-l lg:block" />
      </div>
      <BottomNav items={navItems} />
    </>
  )
}
