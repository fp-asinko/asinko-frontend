'use client'

import type { ReactNode } from 'react'
import { Link, usePathname } from '@/i18n/navigation'

/**
 * A link to a community's page that marks itself as the current page there (S-04, D-M2;
 * specs/community-pages CP-14). The column lives in the layout, so this small client leaf reads
 * the path; its content stays server-rendered (children). Style the active state with
 * `aria-[current=page]:` in `className`.
 */
export function CommunityLink({
  href,
  className,
  children,
}: {
  /** /hub/{slug} or /asset/{SYMBOL}, from communityPath. */
  href: string
  className?: string
  children: ReactNode
}) {
  const active = usePathname() === href

  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={className}>
      {children}
    </Link>
  )
}
