import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setPathname, setSearch } from '@/test/navigation-mock'
import { CommunityLink } from './community-link'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('CommunityLink (home-motion S-04)', () => {
  beforeEach(() => {
    setPathname('/')
    setSearch('')
  })

  it('links to the Home filtered by the community', () => {
    render(<CommunityLink slug="btc">$BTC</CommunityLink>)
    expect(screen.getByRole('link', { name: '$BTC' })).toHaveAttribute('href', '/?community=btc')
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
  })

  it('is the current page while the Home shows that community', () => {
    setSearch('community=btc')
    render(<CommunityLink slug="btc">$BTC</CommunityLink>)
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
  })

  it('is not current for another community or outside the Home', () => {
    setSearch('community=eth')
    const { unmount } = render(<CommunityLink slug="btc">$BTC</CommunityLink>)
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
    unmount()

    setSearch('community=btc')
    setPathname('/communities')
    render(<CommunityLink slug="btc">$BTC</CommunityLink>)
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
  })
})
