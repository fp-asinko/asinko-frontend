import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { SeeAllComments } from './see-all-comments'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('SeeAllComments (specs/post-create-detail PC-17)', () => {
  it("links to the post's page", () => {
    renderWithIntl(<SeeAllComments href="/post/abc/a-title" />)
    expect(screen.getByRole('link', { name: 'See all comments' })).toHaveAttribute(
      'href',
      '/post/abc/a-title',
    )
  })

  it('stays "Coming soon" without a page (polls)', () => {
    renderWithIntl(<SeeAllComments />)
    expect(screen.getByRole('button', { name: 'See all comments' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
