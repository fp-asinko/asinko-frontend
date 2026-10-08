import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router, setPathname } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { CommentsSearch } from './comments-search'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const PATH = '/post/abc/eth-btc'
const field = () => screen.getByRole('searchbox', { name: 'Search comments' })

describe('CommentsSearch (specs/post-detail-refresh PD-05, PD-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setPathname(PATH)
  })

  it('puts the search in the URL, encoded and trimmed, keeping the scroll', async () => {
    renderWithIntl(<CommentsSearch />)
    expect(screen.getByRole('search')).toBeInTheDocument()
    await userEvent.type(field(), '  ETH & blobs {Enter}')
    expect(router.push).toHaveBeenCalledWith(`${PATH}?q=ETH%20%26%20blobs`, { scroll: false })
  })

  it('shows the search of the URL, and an empty one goes back to all the comments', async () => {
    renderWithIntl(<CommentsSearch query="blobs" />)
    expect(field()).toHaveValue('blobs')
    await userEvent.clear(field())
    await userEvent.type(field(), '{Enter}')
    expect(router.push).toHaveBeenCalledWith(PATH, { scroll: false })
  })
})
