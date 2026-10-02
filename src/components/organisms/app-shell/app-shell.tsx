import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { BottomNav } from './bottom-nav'
import { MobileSidebar } from './mobile-sidebar'
import type { NavItem } from './nav-item.types'
import { SidebarContent } from './sidebar-content'
import { SiteHeader } from './site-header'

/*
 * Reddit-style layout, mobile first (design.md §3):
 * < md: 1 column, communities in a panel, bottom bar · md: + fixed left column (15rem)
 * The right column belongs to each page (PageColumns, lg+).
 */
export function AppShell({ navItems, children }: { navItems: NavItem[]; children: ReactNode }) {
  const t = useTranslations('common')

  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-lg bg-card px-4 py-3 text-ui font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-3 focus:ring-ring/50"
      >
        {t('nav.skipToContent')}
      </a>
      <SiteHeader
        menu={
          <MobileSidebar>
            <SidebarContent navItems={navItems} />
          </MobileSidebar>
        }
      />
      <div className="md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-r bg-card px-3 py-4 md:block">
          <SidebarContent navItems={navItems} />
        </div>
        {/* outline-none: focused only by the skip link (tabIndex -1), never reachable with Tab. */}
        <main
          id="content"
          tabIndex={-1}
          className="min-w-0 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none md:px-6 md:pb-8"
        >
          {children}
        </main>
      </div>
      <BottomNav items={navItems} />
    </>
  )
}
