import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setPathname } from '@/test/navigation-mock'
import { CommunityLink } from './community-link'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('CommunityLink (home-motion S-04, specs/community-pages CP-14)', () => {
  beforeEach(() => setPathname('/'))

  it("links to the community's page", () => {
    render(<CommunityLink href="/asset/BTC">$BTC</CommunityLink>)
    expect(screen.getByRole('link', { name: '$BTC' })).toHaveAttribute('href', '/asset/BTC')
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
  })

  it('is the current page on that page', () => {
    setPathname('/asset/BTC')
    render(<CommunityLink href="/asset/BTC">$BTC</CommunityLink>)
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
  })

  it("is not current on another community's page", () => {
    setPathname('/hub/defi')
    render(<CommunityLink href="/asset/BTC">$BTC</CommunityLink>)
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
  })
})
