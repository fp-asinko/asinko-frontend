import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/molecules/theme-toggle'
import { AsinkoLogo } from '@/components/ui/asinko-logo'
import { Link } from '@/i18n/navigation'

// Translucent top bar (apple-design §12): blur over the content, solid with reduced transparency.
export function SiteHeader({ menu }: { menu: ReactNode }) {
  const t = useTranslations('common')

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150 reduced-transparency:bg-card reduced-transparency:backdrop-blur-none">
      <div className="flex h-14 items-center gap-1 px-2 md:px-4">
        {menu}
        <Link
          href="/"
          className="flex min-h-11 items-center rounded-lg px-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <AsinkoLogo label={t('logo')} />
        </Link>
        <div className="ml-auto flex items-center px-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
