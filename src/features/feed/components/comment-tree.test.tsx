import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { commentNode as node } from '../feed-items.fixture'
import type { CommentNode } from '../feed.types'
import { CommentThread } from './comment-thread'
import { CommentTree } from './comment-tree'

// Mentions have their own tests (specs/mention-autocomplete): out of this component's.
vi.mock('@/lib/mentions/search-mentions.action', () => ({ searchMentions: vi.fn() }))
vi.mock('@/components/molecules/mention-assist', () => ({ MentionField: () => null }))
vi.mock('../actions/create-comment.action', () => ({ createComment: vi.fn() }))
vi.mock('../actions/vote-comment.action', () => ({ voteComment: vi.fn() }))
vi.mock('../actions/vote-post.action', () => ({ votePost: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const POST = '00000000-0000-4000-8000-000000000999'

function renderTree(comments: CommentNode[]) {
  return renderWithIntl(
    <CommentThread>
      <CommentTree postId={POST} comments={comments} />
    </CommentThread>,
  )
}

describe('CommentTree (specs/post-create-detail PC-14)', () => {
  it('shows each comment with its author linked to the profile, its votes and Reply', () => {
    renderTree([node({ body: 'Top', edited: true }, [node({ body: 'Nested' })])])
    expect(screen.getByText('Top')).toBeInTheDocument()
    expect(screen.getByText('Nested')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '@maria' })[0]).toHaveAttribute(
      'href',
      '/user/maria',
    )
    expect(screen.getByText('edited')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Reply' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Upvote' })).toHaveLength(2)
  })

  it('keeps a deleted comment as [deleted] once, without votes nor Reply, over its replies', () => {
    renderTree([node({ deleted: true, author: null, body: '' }, [node({ body: 'Still here' })])])
    expect(screen.getAllByText('[deleted]')).toHaveLength(1)
    expect(screen.getByText('Still here')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Reply' })).toHaveLength(1)
  })

  it('folds the replies from level 4 and opens them on demand', async () => {
    renderTree([
      node({ body: 'Level 1' }, [
        node({ body: 'Level 2' }, [
          node({ body: 'Level 3' }, [node({ body: 'Level 4' }, [node({ body: 'Level 5' })])]),
        ]),
      ]),
    ])
    expect(screen.getByText('Level 3')).toBeInTheDocument()
    expect(screen.queryByText('Level 4')).not.toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: /See 2 replies/ })
    await userEvent.click(toggle)
    expect(screen.getByText('Level 4')).toBeInTheDocument()
    expect(screen.getByText('Level 5')).toBeInTheDocument()
    expect(toggle).toHaveTextContent('Hide replies')
  })
})

describe('CommentTree with ads (specs/post-detail-refresh PD-07)', () => {
  const ad = {
    id: 'ad1',
    advertiser: 'Asinko',
    logoUrl: null,
    body: 'Publish your first thesis.',
    url: 'https://example.com',
    domain: 'example.com',
    imageUrl: null,
  }

  it('reads the ad before the replies of its comment', () => {
    renderTree([node({ body: 'Parent', ad }, [node({ body: 'Child' })]), node({ body: 'Next' })])
    const text = document.body.textContent ?? ''
    expect(text.indexOf('Parent')).toBeLessThan(text.indexOf('Publish your first thesis.'))
    expect(text.indexOf('Publish your first thesis.')).toBeLessThan(text.indexOf('Child'))
    expect(screen.getAllByRole('region', { name: /^Ad: / })).toHaveLength(1)
  })

  it('reads the ad after a comment without replies, at its level', () => {
    renderTree([node({ body: 'First', ad }), node({ body: 'Second' })])
    const aside = screen.getByRole('region', { name: /^Ad: / })
    const items = screen.getAllByRole('listitem')
    expect(items.map((item) => item.contains(aside))).toEqual([false, true, false])
  })
})
