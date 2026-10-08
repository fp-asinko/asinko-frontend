import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { commentNode } from '../feed-items.fixture'
import { CommentSearchResults } from './comment-search-results'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const PATH = '/post/abc/eth-btc'

describe('CommentSearchResults (specs/post-detail-refresh PD-05)', () => {
  it('counts the results, links back to all, and marks what was searched in the plain text', () => {
    renderWithIntl(
      <>
        <p id="live" role="status" />
        <CommentSearchResults
          query="blobs"
          allHref={PATH}
          announcer="live"
          comments={[commentNode({ body: 'The **blobs** pay [ETH](https://ethereum.org).' })]}
        />
      </>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('1 result for “blobs”')
    expect(screen.getByRole('link', { name: 'See all comments' })).toHaveAttribute('href', PATH)
    const mark = screen.getByText('blobs', { selector: 'mark' })
    expect(mark.closest('p')).toHaveTextContent('The blobs pay ETH.')
    // The Markdown is plain text here: no link in the result.
    expect(screen.queryByRole('link', { name: 'ETH' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '@maria' })).toHaveAttribute(
      'data-preview',
      'user:maria',
    )
  })

  it('says when nothing matches', () => {
    renderWithIntl(
      <>
        <p id="live" role="status" />
        <CommentSearchResults query="zz" allHref={PATH} comments={[]} announcer="live" />
      </>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('No results for “zz”')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
