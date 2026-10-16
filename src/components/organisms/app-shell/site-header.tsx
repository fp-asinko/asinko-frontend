import { BellIcon, PlusIcon, SearchIcon, UserIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { AccountButtons } from '@/components/organisms/auth-gate'
import { ComposeTrigger } from '@/components/organisms/compose'
import { AsinkoLogo } from '@/components/ui/asinko-logo'
import { Link } from '@/i18n/navigation'
import { MoreMenu } from './more-menu'

const ICON_BUTTON =
  'inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface'

/*
 * Top bar, minimal like Reddit's (specs/header-refresh): logo · search over the feed · actions.
 * From lg the bar uses the shell's grid (left 260 | center + right 300, centered together), so the
 * search sits right over the feed column at any width (HR-01); the actions stay at the window's
 * right edge, over the right column. Between md and lg (no right column) the row is a plain flex,
 * so the search shrinks instead of running into the actions.
 * Language and dark mode live in "⋯" (HR-03). Search and notifications are not in the MVP: disabled
 * (H-26). Profile takes you to your own page (HR-02, since specs/profile-track-record). Without a session the actions are Sign up and Log in (G-02, HR-02).
 * "+ Create" stays at hand from md, at every scroll, and opens the editor in a window over the page,
 * as X's "Post" (specs/post-create-detail PC-01); without a session it opens the account modal.
 */
export function SiteHeader({
  menu,
  devTools,
  profileHref = null,
}: {
  menu: ReactNode
  devTools?: ReactNode
  /** The viewer's own page; the profile icon only shows with a session (AccountButtons). */
  profileHref?: string | null
}) {
  const t = useTranslations('common')

  return (
    <header
      // Its controls never scroll the page when focused (globals.css: scroll-padding).
      data-site-header
      className="sticky top-0 z-40 border-b bg-header/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl reduced-transparency:bg-header reduced-transparency:backdrop-blur-none"
    >
      <div className="flex h-15 items-center gap-1 px-2 md:gap-2 md:px-4 lg:relative lg:grid lg:grid-cols-[16.25rem_minmax(0,1fr)] lg:gap-0 lg:px-0">
        <div className="flex shrink-0 items-center md:w-60 lg:w-auto lg:px-4">
          {menu}
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center rounded-lg px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:px-2"
          >
            <AsinkoLogo label={t('logo')} />
          </Link>
        </div>

        {/* Mirrors the shell's center: the main column (sm:px-4, max 780px) and the right one. */}
        <div className="hidden min-w-0 flex-1 md:flex lg:justify-center">
          <div className="flex min-w-0 flex-1 justify-center lg:max-w-195 lg:px-4">
            {/* Column flex: stretches the coming-soon wrapper (and its button) to the width. */}
            <div className="flex w-full max-w-140 flex-col">
              <ComingSoon
                label={t('nav.search')}
                className="flex h-10 w-full items-center gap-2.5 rounded-full bg-surface px-4 text-left type-ui text-muted-foreground hover:bg-muted"
              >
                <SearchIcon aria-hidden className="size-4 shrink-0" />
                <span className="truncate">{t('header.search')}</span>
              </ComingSoon>
            </div>
          </div>
          <div aria-hidden className="hidden w-75 shrink-0 lg:block" />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 lg:absolute lg:inset-y-0 lg:right-4">
          <span className="md:hidden">
            <ComingSoon label={t('nav.search')} className={ICON_BUTTON}>
              <SearchIcon aria-hidden className="size-5" />
            </ComingSoon>
          </span>
          {devTools}
          <ComposeTrigger className="hidden h-10 tap items-center gap-1.5 rounded-full bg-muted pr-4 pl-3 type-action text-foreground outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 md:inline-flex">
            <PlusIcon aria-hidden className="size-4.5" />
            {t('nav.create')}
          </ComposeTrigger>
          <AccountButtons>
            {/* With a session: notifications and profile from md (HR-02, Q2). */}
            <span className="hidden items-center gap-1 md:flex">
              <ComingSoon label={t('header.notifications')} className={ICON_BUTTON}>
                <BellIcon aria-hidden className="size-5" />
              </ComingSoon>
              {profileHref && (
                <Link
                  href={profileHref}
                  aria-label={t('header.profile')}
                  className={`${ICON_BUTTON} tap outline-none focus-visible:ring-3 focus-visible:ring-ring/50`}
                >
                  <UserIcon aria-hidden className="size-5" />
                </Link>
              )}
            </span>
          </AccountButtons>
          <MoreMenu />
        </div>
      </div>
    </header>
  )
}
