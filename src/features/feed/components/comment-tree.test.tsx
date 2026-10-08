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

  it('folds the replies from level 4 as "⊕ N more replies" and opens them on demand (CT-08)', async () => {
    renderTree([
      node({ body: 'Level 1' }, [
        node({ body: 'Level 2' }, [
          node({ body: 'Level 3' }, [node({ body: 'Level 4' }, [node({ body: 'Level 5' })])]),
        ]),
      ]),
    ])
    expect(screen.getByText('Level 3')).toBeInTheDocument()
    expect(screen.queryByText('Level 4')).not.toBeInTheDocument()

    const more = screen.getByRole('button', { name: '2 more replies' })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(more)
    expect(screen.getByText('Level 4')).toBeInTheDocument()
    expect(screen.getByText('Level 5')).toBeInTheDocument()
    expect(more).not.toBeInTheDocument()
    // The focus goes to the first reply shown.
    expect(screen.getByText('Level 4').closest('li')).toHaveFocus()
  })
})

describe('CommentTree wired as Reddit (specs/comment-threads)', () => {
  it('gives each comment its link id and a Share button (CT-11, CT-12)', () => {
    const parent = node({ body: 'Top' }, [node({ body: 'Nested' })])
    renderTree([parent])
    expect(screen.getByText('Top').closest('li')).toHaveAttribute('id', `comment-${parent.id}`)
    expect(screen.getAllByRole('button', { name: 'Share' })).toHaveLength(2)
  })

  it('closes a thread with ⊖ and opens it with ⊕, the focus on ⊕ (CT-06, CT-09)', async () => {
    renderTree([node({ body: 'Top' }, [node({ body: 'Nested' })])])
    const collapse = screen.getAllByRole('button', { name: "Collapse @maria's comment" })[0]!
    expect(collapse).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(collapse)
    expect(screen.getByText('Top')).not.toBeVisible()
    expect(screen.getByText('Nested')).not.toBeVisible()
    const expand = screen.getByRole('button', { name: "Expand @maria's comment" })
    expect(expand).toHaveFocus()
    expect(expand).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(expand)
    expect(screen.getByText('Top')).toBeVisible()
    expect(screen.getByText('Nested')).toBeVisible()
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
