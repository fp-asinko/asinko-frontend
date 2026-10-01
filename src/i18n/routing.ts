import { defineRouting } from 'next-intl/routing'

// docs/ai-guidelines/i18n.md: en is the default and x-default; pt is Brazilian Portuguese.
export const routing = defineRouting({
  locales: ['en', 'es', 'pt'],
  defaultLocale: 'en',
  localePrefix: 'always',
  // Each view adds its translated pathnames in its own spec.
})

export type Locale = (typeof routing.locales)[number]
