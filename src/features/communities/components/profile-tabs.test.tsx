import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ProfileTabs } from './profile-tabs'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('ProfileTabs (specs/profile-track-record PT-04, PT-10)', () => {
  it('links Theses to ?tab=theses and Posts to the page, in that order, marking the current one', () => {
    renderWithIntl(<ProfileTabs pagePath="/user/maria" current="theses" />)
    const nav = screen.getByRole('navigation', { name: 'Profile sections' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Posts' })).toHaveAttribute('href', '/user/maria')
    const theses = screen.getByRole('link', { name: 'Theses' })
    expect(theses).toHaveAttribute('href', '/user/maria?tab=theses')
    expect(theses).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Posts' })).not.toHaveAttribute('aria-current')
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Theses',
      'Posts',
      'Replies',
    ])
  })

  it('links Replies to ?tab=replies (specs/backend-adoption BK-03)', () => {
    renderWithIntl(<ProfileTabs pagePath="/user/maria" current="replies" />)
    const replies = screen.getByRole('link', { name: 'Replies' })
    expect(replies).toHaveAttribute('href', '/user/maria?tab=replies')
    expect(replies).toHaveAttribute('aria-current', 'page')
  })
})
