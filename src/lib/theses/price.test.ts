// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createFormatter } from 'next-intl'
import { thesisPrice } from './price'

const format = createFormatter({ locale: 'en' })

describe('thesisPrice', () => {
  it('shows cents only below $1,000', () => {
    expect(thesisPrice(format, 150000)).toBe('$150,000')
    expect(thesisPrice(format, 182.47)).toBe('$182.47')
    expect(thesisPrice(format, 2)).toBe('$2')
  })
})
