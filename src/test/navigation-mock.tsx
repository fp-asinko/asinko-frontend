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

export function Link({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}
