import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReplyListSkeleton } from './reply-list-skeleton'

describe('ReplyListSkeleton (specs/backend-adoption BK-03)', () => {
  it('draws three replies, hidden from assistive tech', () => {
    const { container } = render(<ReplyListSkeleton />)
    const list = container.querySelector('ul')!
    expect(list).toHaveAttribute('aria-hidden', 'true')
    expect(list.querySelectorAll('li')).toHaveLength(3)
  })
})
