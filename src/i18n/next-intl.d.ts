import type messages from '../../messages/en.json'
import type { routing } from './routing'

// Type-safe keys and locales: en.json is the source of every key (i18n.md).
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
  }
}
