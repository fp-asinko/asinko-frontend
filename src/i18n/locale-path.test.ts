// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { splitLocale } from './locale-path'

describe('splitLocale (specs/auth AU-03)', () => {
  it('splits the locale from the rest of the path, keeping the query', () => {
    expect(splitLocale('/es/hub/macro?sort=new')).toEqual({
      locale: 'es',
      href: '/hub/macro?sort=new',
    })
    expect(splitLocale('/pt')).toEqual({ locale: 'pt', href: '/' })
    expect(splitLocale('/en?x=1')).toEqual({ locale: 'en', href: '/?x=1' })
  })

  it('takes a path without a known locale as the default one', () => {
    expect(splitLocale('/hub/macro')).toEqual({ locale: 'en', href: '/hub/macro' })
    expect(splitLocale('/')).toEqual({ locale: 'en', href: '/' })
  })
})
