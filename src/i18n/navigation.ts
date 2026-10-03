import { createNavigation } from 'next-intl/navigation'
// Query params carry no locale, so the plain hook is fine; exported here so code and tests use one module.
export { useSearchParams } from 'next/navigation'
import { routing } from './routing'

// The only navigation the app uses: next/link and next/navigation lose the locale (tooling.md).
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
