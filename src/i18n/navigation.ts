import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// The only navigation the app uses: next/link and next/navigation lose the locale (tooling.md).
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
