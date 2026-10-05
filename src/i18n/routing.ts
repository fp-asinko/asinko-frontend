import { defineRouting } from 'next-intl/routing'

// docs/ai-guidelines/i18n.md: en is the default and x-default; pt is Brazilian Portuguese.
export const routing = defineRouting({
  locales: ['en', 'es', 'pt'],
  defaultLocale: 'en',
  localePrefix: 'always',
  // English first (H-27, specs/home): / always goes to /en, whatever the browser language. The
  // locale is chosen in the top bar's "⋯" menu and lives in the URL.
  localeDetection: false,
  // Each view adds its translated pathnames in its own spec.
})

export type Locale = (typeof routing.locales)[number]
