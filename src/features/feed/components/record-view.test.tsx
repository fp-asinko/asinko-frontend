import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { readRecent, recordRecent } from '@/lib/recently-viewed'
import { RecordView } from './record-view'

const item = {
  id: 'p1',
  href: '/post/p1/eth-btc',
  label: '$ETH',
  title: 'ETH/BTC at a 4-year low',
  kind: 'post' as const,
  score: 389,
  comments: 30,
}

describe('RecordView (specs/recently-viewed RV-03)', () => {
  beforeEach(() => localStorage.clear())

  it('notes the post opened, first in the list, and draws nothing', () => {
    const { container } = render(<RecordView item={item} owner="guest" />)
    expect(container).toBeEmptyDOMElement()
    expect(readRecent()[0]).toMatchObject({ id: 'p1', label: '$ETH', score: 389, comments: 30 })
  })

  it('starts the list over for another account (RV-10)', () => {
    render(<RecordView item={item} owner="guest" />)
    render(<RecordView item={{ ...item, id: 'p2', href: '/post/p2/x' }} owner="account-1" />)
    expect(readRecent().map((each) => each.id)).toEqual(['p2'])
    recordRecent({ ...item, id: 'p3', href: '/post/p3/x' })
    render(<RecordView item={item} owner="account-1" />)
    expect(readRecent().map((each) => each.id)).toEqual(['p1', 'p3', 'p2'])
  })
})
