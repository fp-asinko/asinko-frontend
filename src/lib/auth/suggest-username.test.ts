// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { suggestUsername } from './suggest-username'

describe('suggestUsername (specs/auth AU-11)', () => {
  it.each([
    ['Ana.Perez@example.com', 'ana_perez'],
    ['juan-segundo+asinko@gmail.com', 'juan_segundo_asinko'],
    ['josé.núñez@example.com', 'jose_nunez'],
    ['__trader__@x.io', 'trader'],
    ['a'.repeat(40) + '@x.io', 'a'.repeat(30)],
    ['abcdefghijklmnopqrstuvwxyz1234.5@x.io', 'abcdefghijklmnopqrstuvwxyz1234'],
  ])('suggests %s as %s', (email, username) => {
    expect(suggestUsername(email)).toBe(username)
  })

  it.each(['ab@x.io', '..@x.io', '', null, undefined])('suggests nothing for %j', (email) => {
    expect(suggestUsername(email)).toBeNull()
  })
})
