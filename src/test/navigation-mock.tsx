import type { AnchorHTMLAttributes } from 'react'
import { vi } from 'vitest'

// Stand-in for @/i18n/navigation in unit tests (testing.md § Mocks). Usage:
//   vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
//   setPathname('/')
let pathname = '/'

export function setPathname(next: string) {
  pathname = next
}

export function usePathname() {
  return pathname
}

let search = new URLSearchParams()

/** Sets the query string read by useSearchParams, e.g. setSearch('community=btc'). */
export function setSearch(query: string) {
  search = new URLSearchParams(query)
}

export function useSearchParams() {
  return search
}

/** Spies of the localized router: assert on them, reset with vi.clearAllMocks(). */
export const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }

export function useRouter() {
  return router
}

type Href = string | { pathname: string; query?: Record<string, string> }

function toUrl(href: Href) {
  if (typeof href === 'string') return href
  const query = new URLSearchParams(href.query).toString()
  return query ? `${href.pathname}?${query}` : href.pathname
}

export function Link({
  href,
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: Href }) {
  return (
    <a href={toUrl(href)} {...props}>
      {children}
    </a>
  )
}
