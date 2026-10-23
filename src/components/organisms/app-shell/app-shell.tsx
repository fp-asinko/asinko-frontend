import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { BottomNav } from './bottom-nav'
import { LeftColumnToggle } from './left-column-toggle'
import { MobileSidebar } from './mobile-sidebar'
import type { NavItem } from './nav-item.types'
import { SiteHeader } from './site-header'
import { StickyColumn } from './sticky-column'

/*
 * Layout of the prototype (specs/home/design.md §3), mobile first:
 * < md: 1 column, left column in the menu panel, bottom bar
 * md: left 260px + center · lg: left 260px + [center (max 780px) + right 300px], centered
 * The content of the left and right columns comes from the layout (organisms do not know the
 * business). The right one only exists from lg, as in the prototype (specs/right-column).
 */
export function AppShell({
  navItems,
  sidebar,
  right,
  devTools,
  profileHref = null,
  leftFolded = false,
  children,
}: {
  /** The left column folded, as the viewer left it (the cookie, specs/sidebar-toggle SL-08). */
  leftFolded?: boolean
  navItems: NavItem[]
  sidebar: ReactNode
  right?: ReactNode
  /** Development tools for the top bar (specs/dev-login); never in production. */
  devTools?: ReactNode
  /** The viewer's own page (/user/maria), or null without a session (specs/header-refresh HR-02). */
  profileHref?: string | null
  children: ReactNode
}) {
  const t = useTranslations('common')
  const tr = useTranslations('rightColumn')

  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-lg bg-background px-4 py-3 type-ui font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-3 focus:ring-ring/50"
      >
        {t('nav.skipToContent')}
      </a>
      <SiteHeader
        devTools={devTools}
        profileHref={profileHref}
        menu={<MobileSidebar>{sidebar}</MobileSidebar>}
      />
      {/* The left column opens and folds, as Reddit's (specs/sidebar-toggle): folded, a 32px
          strip with its line. `left-folded:` (globals.css) reads the toggle's state and a page's
          own choice from the HTML, so the server's first paint is already right. Its width slides,
          as a drawer: 200ms to open and 150 to close (design-system.md § Motion; no motion with
          prefers-reduced-motion). */}
      <LeftColumnToggle initialFolded={leftFolded} />
      <div className="md:grid md:grid-cols-[16.25rem_minmax(0,1fr)] md:transition-[grid-template-columns] md:duration-200 md:ease-out md:left-folded:grid-cols-[2rem_minmax(0,1fr)] md:left-folded:duration-150">
        <div
          id="left-column"
          // Open, a short shadow towards the content (SL-05), over the center's cards (z-10).
          className="sticky top-15 z-10 hidden h-[calc(100dvh-3.75rem)] overflow-hidden border-r bg-background md:block md:shadow-rail md:left-folded:shadow-none"
        >
          {/* Its full width while the column slides (clipped, never squeezed), fading out as it
              folds and in as it opens; folded, invisible: out of reach and of what is read (SL-06).
              Room on the right, as Reddit's (PO, 2026-10-23, SL-13): the content ends 28px from
              the line, clear of the toggle that sits on it, with a little air before it. */}
          <div className="h-full w-65 overflow-y-auto py-2.5 pr-7 pl-2 transition-[opacity,visibility] duration-200 ease-out left-folded:invisible left-folded:opacity-0 left-folded:duration-150">
            {sidebar}
          </div>
        </div>
        {/* Center (max 780px) and right (300px) travel together, centered in the remaining space,
            as in the prototype: at 1440px the right column sits next to the center, not at the edge.
            A grid of two rows: a page's hero (data-hero, a group's banner, specs/community-widgets
            CW-01) takes the first row over both columns, inside <main> (a subgrid), and the right
            column starts under it. Without a hero, both columns take both rows. */}
        <div className="group/row min-w-0 lg:grid lg:grid-cols-[minmax(0,48.75rem)_18.75rem] lg:grid-rows-[auto_1fr] lg:justify-center">
          {/* outline-none: focused only by the skip link (tabIndex -1), never reachable with Tab. */}
          <main
            id="content"
            tabIndex={-1}
            className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none sm:px-4 sm:pt-6 md:pb-8 lg:col-start-1 lg:row-start-1 lg:row-end-3 lg:has-[>[data-hero]]:col-end-3 lg:has-[>[data-hero]]:grid lg:has-[>[data-hero]]:grid-cols-subgrid lg:has-[>[data-hero]]:grid-rows-subgrid lg:has-[>[data-hero]]:content-start"
          >
            {children}
          </main>
          {/* Right column (RC-01): no scroll of its own, as Reddit's (PO, 2026-10-21): it scrolls
              with the page and stays at the bottom once its end shows (StickyColumn). At least the
              screen's height, so a short one keeps its footer at the bottom. Without content it
              stays an empty div: no empty landmark. overflow-x: clip, not a scroll container (sticky still
              works): the edge a "Coming soon" bubble keeps inside. */}
          {right ? (
            <StickyColumn
              label={tr('label')}
              className="sticky top-15 hidden min-h-[calc(100dvh-3.75rem)] w-75 shrink-0 flex-col self-start overflow-x-clip border-l lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex lg:group-has-[main>[data-hero]]/row:row-span-1 lg:group-has-[main>[data-hero]]/row:row-start-2"
            >
              {right}
            </StickyColumn>
          ) : (
            <div className="hidden w-75 shrink-0 border-l lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:block lg:group-has-[main>[data-hero]]/row:row-span-1 lg:group-has-[main>[data-hero]]/row:row-start-2" />
          )}
        </div>
      </div>
      <BottomNav items={navItems} profileHref={profileHref} />
    </>
  )
}
