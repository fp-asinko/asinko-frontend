import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { BottomNav } from './bottom-nav'
import { MobileSidebar } from './mobile-sidebar'
import type { NavItem } from './nav-item.types'
import { SiteHeader } from './site-header'

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
  children,
}: {
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
      {/* A page can fold the left column (LeftColumnFold, specs/submit-tools ST-08): while its
          button says so, the column is a 56px strip and its content is hidden, by CSS alone, so
          the other pages carry no code for it. Its width slides, as a drawer: 200ms to open and
          150 to close (design-system.md § Motion; no motion with prefers-reduced-motion). */}
      <div className="md:grid md:grid-cols-[16.25rem_minmax(0,1fr)] md:transition-[grid-template-columns] md:duration-200 md:ease-out md:[html:has([data-left-fold=folded])_&]:grid-cols-[3.5rem_minmax(0,1fr)] md:[html:has([data-left-fold=folded])_&]:duration-150">
        <div
          id="left-column"
          // With the fold button, the top 56px stay for it and only the content below scrolls:
          // nothing passes under the button (WCAG 2.4.11).
          className="sticky top-15 hidden h-[calc(100dvh-3.75rem)] overflow-y-auto border-r px-2 py-2.5 md:block [html:has([data-left-fold])_&]:overflow-hidden [html:has([data-left-fold])_&]:p-0 [html:has([data-left-fold])_&]:pt-14"
        >
          {/* Its full width while the column slides (clipped, never squeezed), fading out as it
              folds and in as it opens; folded, invisible: out of reach and of what is read. */}
          <div className="[html:has([data-left-fold=folded])_&]:invisible [html:has([data-left-fold=folded])_&]:opacity-0 [html:has([data-left-fold=folded])_&]:duration-150 [html:has([data-left-fold])_&]:h-full [html:has([data-left-fold])_&]:w-65 [html:has([data-left-fold])_&]:overflow-y-auto [html:has([data-left-fold])_&]:px-2 [html:has([data-left-fold])_&]:pb-2.5 [html:has([data-left-fold])_&]:transition-[opacity,visibility] [html:has([data-left-fold])_&]:duration-200 [html:has([data-left-fold])_&]:ease-out">
            {sidebar}
          </div>
        </div>
        {/* Center (max 780px) and right (300px) travel together, centered in the remaining space,
            as in the prototype: at 1440px the right column sits next to the center, not at the edge. */}
        <div className="min-w-0 lg:flex lg:justify-center">
          {/* outline-none: focused only by the skip link (tabIndex -1), never reachable with Tab. */}
          <main
            id="content"
            tabIndex={-1}
            className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none sm:px-4 sm:pt-6 md:pb-8 lg:max-w-195 lg:flex-1"
          >
            {children}
          </main>
          {/* Right column (RC-01): fixed under the 60px bar like the left one, with its own scroll.
              Without content it stays an empty div: no empty landmark. */}
          {right ? (
            <aside
              aria-label={tr('label')}
              className="sticky top-15 hidden h-[calc(100dvh-3.75rem)] w-75 shrink-0 self-start overflow-y-auto border-l lg:block"
            >
              {right}
            </aside>
          ) : (
            <div className="hidden w-75 shrink-0 border-l lg:block" />
          )}
        </div>
      </div>
      <BottomNav items={navItems} profileHref={profileHref} />
    </>
  )
}
