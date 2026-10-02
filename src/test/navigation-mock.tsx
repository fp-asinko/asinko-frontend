import type { AnchorHTMLAttributes } from 'react'

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
