// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { logInSchema, profileSchema, signUpSchema } from './auth.schema'

const VALID = {
  email: ' Ana@Example.com ',
  password: 'long-enough',
  username: 'ana_92',
  accepted: true,
}

const messages = (input: unknown) =>
  signUpSchema.safeParse(input).error?.issues.map((issue) => issue.message) ?? []

describe('auth schemas (specs/auth AU-05, AU-06)', () => {
  it('takes a valid sign up, trimming the email and the username', () => {
    expect(signUpSchema.parse({ ...VALID, username: ' ana_92 ' })).toEqual({
      ...VALID,
      email: 'Ana@Example.com',
    })
  })

  it('says what is wrong with each field, as translation keys', () => {
    expect(messages({ ...VALID, email: 'ana@' })).toEqual(['auth.fields.email.invalid'])
    expect(messages({ ...VALID, password: '1234567' })).toEqual(['auth.fields.password.short'])
    expect(messages({ ...VALID, password: 'x'.repeat(73) })).toEqual(['auth.fields.password.long'])
    expect(messages({ ...VALID, accepted: false })).toEqual(['auth.fields.accepted.required'])
  })

  it.each(['ab', 'x'.repeat(31), 'ana-92', 'ana 92', 'añá'])(
    'refuses the username %j as the backend would',
    (username) => {
      expect(messages({ ...VALID, username })).toEqual(['auth.fields.username.invalid'])
    },
  )

  it('logs in with any password, but not an empty one (AU-04)', () => {
    expect(logInSchema.safeParse({ email: 'ana@example.com', password: 'x' }).success).toBe(true)
    expect(
      logInSchema.safeParse({ email: 'ana@example.com', password: '' }).error?.issues[0]?.message,
    ).toBe('auth.fields.password.required')
  })

  it('chooses a username only with age and terms accepted (AU-11)', () => {
    expect(profileSchema.safeParse({ username: 'ana_92', accepted: true }).success).toBe(true)
    expect(profileSchema.safeParse({ username: 'ana_92', accepted: false }).success).toBe(false)
  })
})
