'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useTransition, type RefObject } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

/**
 * The "⋯" menu itself (Base UI Menu), loaded on the first open by MoreMenu (HR-03, HR-07):
 * language, dark mode and, on phones without a session, Sign up.
 */
export function MoreMenuPopup({
  open,
  onOpenChange,
  anchor,
  compact,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchor: RefObject<HTMLButtonElement | null>
  /** Below md, where Sign up does not fit in the bar (HR-04). */
  compact: boolean
}) {
  const t = useTranslations('common')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { signedIn, openGate } = useAuthGate()
  const [, startTransition] = useTransition()

  function switchLocale(next: Locale) {
    // Same page in the other language, keeping the filters (H-27).
    startTransition(() => router.replace(`${pathname}${window.location.search}`, { locale: next }))
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuContent anchor={anchor} finalFocus={anchor} align="end" className="w-56">
        {!signedIn && compact && (
          // Sign up does not fit in the bar on phones (HR-04).
          <DropdownMenuGroup>
            <DropdownMenuItem className="min-h-10" onClick={() => openGate('signup')}>
              {t('menu.signup')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
        )}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('locale.label')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(value) => switchLocale(value as Locale)}
          >
            {routing.locales.map((each) => (
              // lang: each name is read in its own language (WCAG 3.1.2).
              <DropdownMenuRadioItem key={each} value={each} lang={each} className="min-h-10">
                {t(`locale.names.${each}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          className="min-h-10"
          checked={resolvedTheme === 'dark'}
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        >
          {t('theme.toggle')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
