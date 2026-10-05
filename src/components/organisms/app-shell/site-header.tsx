import { BellIcon, CoinsIcon, SearchIcon, UserIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { AccountButtons } from '@/components/organisms/auth-gate'
import { LocaleSwitcher } from '@/components/molecules/locale-switcher'
import { ThemeToggle } from '@/components/molecules/theme-toggle'
import { AsinkoLogo } from '@/components/ui/asinko-logo'
import { Link } from '@/i18n/navigation'

const ICON_BUTTON =
  'inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface'

/*
 * Top bar from the prototype (H-05): 60px, translucent, logo · centered search · actions.
 * Search, tokens, notifications and profile are not in the MVP: shown disabled (H-26). Without a
 * session the profile gives way to Log in and Sign up (specs/guest-experience G-02).
 */
export function SiteHeader({ menu }: { menu: ReactNode }) {
  const t = useTranslations('common')

  return (
    <header className="sticky top-0 z-40 border-b bg-header/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl reduced-transparency:bg-header reduced-transparency:backdrop-blur-none">
      <div className="flex h-15 items-center gap-2 px-2 md:px-4">
        {menu}
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center rounded-lg px-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:w-60"
        >
          <AsinkoLogo label={t('logo')} />
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <ComingSoon
            label={t('nav.search')}
            className="flex h-10 w-full max-w-170 items-center gap-2.5 rounded-full border bg-surface px-4 text-left type-ui text-muted-foreground"
          >
            <SearchIcon aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{t('header.search')}</span>
          </ComingSoon>
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <span className="md:hidden">
            <ComingSoon label={t('nav.search')} className={ICON_BUTTON}>
              <SearchIcon aria-hidden className="size-5" />
            </ComingSoon>
          </span>
          <span className="hidden items-center gap-1 md:flex">
            <ComingSoon
              label={t('header.tokens')}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 type-action"
            >
              <CoinsIcon aria-hidden className="size-4" />
              {/* Icon only on tablets: the label does not fit next to the search (800px). */}
              <span className="hidden lg:inline">{t('header.tokens')}</span>
            </ComingSoon>
            <ComingSoon label={t('header.notifications')} className={ICON_BUTTON}>
              <BellIcon aria-hidden className="size-5" />
            </ComingSoon>
          </span>
          <AccountButtons>
            <span className="hidden md:inline-flex">
              <ComingSoon label={t('header.profile')} className={ICON_BUTTON}>
                <UserIcon aria-hidden className="size-5" />
              </ComingSoon>
            </span>
          </AccountButtons>
          {/* Below md they live in the menu panel (MenuSettings): no room next to "Log in". */}
          <span className="hidden items-center gap-1 md:flex">
            <LocaleSwitcher />
            <span className="px-2">
              <ThemeToggle />
            </span>
          </span>
        </div>
      </div>
    </header>
  )
}
