import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import pkg from '../../../../package.json'
import { SiteFooter } from './site-footer'

describe('SiteFooter (RC-03)', () => {
  const names = ['Rules', 'Privacy', 'Terms', 'Accessibility', 'About', 'Careers', 'Press']

  it('offers every link as coming soon until the pages exist', () => {
    renderWithIntl(<SiteFooter />)
    for (const name of names) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('says "Coming soon" when one is activated', async () => {
    renderWithIntl(<SiteFooter />)
    await userEvent.click(screen.getByRole('button', { name: 'Privacy' }))
    expect(
      screen.getAllByRole('status').some((status) => status.textContent === 'Coming soon'),
    ).toBe(true)
  })

  it('says which version is running (PO, 2026-10-21)', () => {
    renderWithIntl(<SiteFooter />)
    expect(screen.getByText(`Version ${pkg.version}`)).toBeInTheDocument()
  })

  it('shows the legal name and the current year (Q3, decided 2026-10-05)', () => {
    renderWithIntl(<SiteFooter />)
    expect(
      screen.getByText(`Asinko, Inc. © ${new Date().getUTCFullYear()}. All rights reserved.`),
    ).toBeInTheDocument()
  })
})
