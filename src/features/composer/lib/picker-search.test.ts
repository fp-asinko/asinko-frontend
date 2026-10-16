// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readSearch } from './picker-search'

describe('readSearch (specs/picker-filters PF-03)', () => {
  it('reads $ as assets and # as groups, without searching the symbol', () => {
    expect(readSearch('$bt')).toEqual({ kind: 'assets', search: 'bt' })
    expect(readSearch('#Mac')).toEqual({ kind: 'groups', search: 'Mac' })
  })

  it('takes the symbol alone as the kind with nothing to search', () => {
    expect(readSearch('$')).toEqual({ kind: 'assets', search: '' })
    expect(readSearch(' # ')).toEqual({ kind: 'groups', search: '' })
  })

  it('leaves the kind to the chips without a leading symbol', () => {
    expect(readSearch(' de ')).toEqual({ kind: null, search: 'de' })
    expect(readSearch('a$b')).toEqual({ kind: null, search: 'a$b' })
    expect(readSearch('@me')).toEqual({ kind: null, search: '@me' })
  })
})
