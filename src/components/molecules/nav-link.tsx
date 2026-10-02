'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const navLinkVariants = cva(
  'flex items-center rounded-lg transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
  {
    variants: {
      /** `bar`: icon over label (mobile bottom bar). `list`: icon beside label (sidebar). */
      variant: {
        bar: 'min-h-12 min-w-16 flex-col justify-center gap-0.5 px-3 text-meta',
        list: 'min-h-11 gap-3 px-3 text-ui hover:bg-accent',
      },
      // Active: monochrome primary on icon and label, as the prototype.
      active: {
        true: 'font-semibold text-primary [&_svg]:text-primary',
        false: 'text-muted-foreground hover:text-foreground',
      },
    },
  },
)

export type NavLinkProps = {
  href: string
  label: string
  icon: ReactNode
  variant: NonNullable<VariantProps<typeof navLinkVariants>['variant']>
}

export function NavLink({ href, label, icon, variant }: NavLinkProps) {
  const isActive = usePathname() === href

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(navLinkVariants({ variant, active: isActive }))}
    >
      <span aria-hidden className="[&_svg]:size-6">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  )
}
