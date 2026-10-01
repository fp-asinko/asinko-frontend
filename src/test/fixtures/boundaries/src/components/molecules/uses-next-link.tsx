// VIOLATION no-restricted-imports: next/link outside src/i18n/.
import Link from 'next/link'

export function UsesNextLink() {
  return <Link href="/">home</Link>
}
