import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { readRecent } from '@/lib/recently-viewed'
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
    const { container } = render(<RecordView item={item} />)
    expect(container).toBeEmptyDOMElement()
    expect(readRecent()[0]).toMatchObject({ id: 'p1', label: '$ETH', score: 389, comments: 30 })
  })
})
