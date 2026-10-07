import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { identityIndex } from '@/lib/identity-color'
import { IdentityBanner } from './identity-banner'

describe('IdentityBanner (specs/community-pages § 1)', () => {
  it('fills with the identity gradient of its key when there is no image', () => {
    render(<IdentityBanner colorKey="macro" />)
    const banner = screen.getByTestId('identity-banner')
    expect(banner).toHaveAttribute('data-color', String(identityIndex('macro')))
    expect(banner.className).toMatch(/from-avatar-\d to-avatar-\d-to/)
    expect(banner).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows the image instead, decorative', () => {
    render(<IdentityBanner colorKey="macro" imageUrl="/mocks/banner.png" />)
    const banner = screen.getByTestId('identity-banner')
    expect(banner).not.toHaveAttribute('data-color')
    expect(banner.querySelector('img')).toHaveAttribute('alt', '')
  })
})
