import { LocaleSwitcher } from '@/components/molecules/locale-switcher'
import { ThemeToggle } from '@/components/molecules/theme-toggle'

/**
 * Language and theme in the menu panel on phones: below md the top bar has no room for them next
 * to "Log in" at 360px (specs/guest-experience, decided 2026-10-05), as Reddit and X do.
 */
export function MenuSettings() {
  return (
    <div className="mt-auto flex items-center justify-between gap-3 border-t px-3 pt-4">
      <LocaleSwitcher />
      <ThemeToggle />
    </div>
  )
}
