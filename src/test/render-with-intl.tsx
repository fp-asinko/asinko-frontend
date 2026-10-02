import { render, type RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import type { Locale } from '@/i18n/routing'
import en from '../../messages/en.json'
import es from '../../messages/es.json'
import pt from '../../messages/pt.json'

const MESSAGES = { en, es, pt }

// Renders with the messages of a locale, the default one unless told otherwise (testing.md).
export function renderWithIntl(
  ui: ReactElement,
  { locale = 'en', ...options }: Omit<RenderOptions, 'wrapper'> & { locale?: Locale } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  })
}
