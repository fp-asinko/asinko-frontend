'use client'

import type { ReactNode } from 'react'
import { Link, usePathname, useSearchParams } from '@/i18n/navigation'

/**
 * A link to the Home filtered by a community that marks itself as the current page when the feed
 * shows that community (S-04, D-M2). The column lives in the layout, which gets no query params,
 * so this small client leaf reads them; its content stays server-rendered (children). Style the
 * active state with `aria-[current=page]:` in `className`.
 */
export function CommunityLink({
  slug,
  className,
  children,
}: {
  slug: string
  className?: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const search = useSearchParams()
  const active = pathname === '/' && search.get('community') === slug

  return (
    <Link
      href={{ pathname: '/', query: { community: slug } }}
      aria-current={active ? 'page' : undefined}
      className={className}
    >
      {children}
    </Link>
  )
}
