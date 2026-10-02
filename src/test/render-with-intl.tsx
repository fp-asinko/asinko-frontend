import { render, type RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import messages from '../../messages/en.json'

// Renders with the default locale's messages (docs/ai-guidelines/testing.md).
export function renderWithIntl(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  })
}
