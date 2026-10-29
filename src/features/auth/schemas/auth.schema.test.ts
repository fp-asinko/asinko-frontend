// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { logInSchema, profileSchema, signUpSchema } from './auth.schema'

const issue = (schema: typeof signUpSchema | typeof profileSchema, input: unknown) =>
  schema.safeParse(input).error?.issues.map((each) => each.message) ?? []

describe('auth schemas (specs/auth AU-05, AU-06, AU-11)', () => {
  it('signs up with only email and password, trimming the email (design.md § 11)', () => {
    expect(signUpSchema.parse({ email: ' Ana@Example.com ', password: 'long-enough' })).toEqual({
      email: 'Ana@Example.com',
      password: 'long-enough',
    })
  })

  it('says what is wrong with each field, as translation keys', () => {
    const valid = { email: 'ana@example.com', password: 'long-enough' }
    expect(issue(signUpSchema, { ...valid, email: 'ana@' })).toEqual(['auth.fields.email.invalid'])
    expect(issue(signUpSchema, { ...valid, password: '1234567' })).toEqual([
      'auth.fields.password.short',
    ])
    expect(issue(signUpSchema, { ...valid, password: 'x'.repeat(73) })).toEqual([
      'auth.fields.password.long',
    ])
  })

  it.each(['ab', 'x'.repeat(31), 'ana-92', 'ana 92', 'añá'])(
    'refuses the username %j as the backend would',
    (username) => {
      expect(issue(profileSchema, { username, accepted: true })).toEqual([
        'auth.fields.username.invalid',
      ])
    },
  )

  it('chooses a trimmed username only with age and terms accepted (AU-11)', () => {
    expect(profileSchema.parse({ username: ' ana_92 ', accepted: true })).toEqual({
      username: 'ana_92',
      accepted: true,
    })
    expect(issue(profileSchema, { username: 'ana_92', accepted: false })).toEqual([
      'auth.fields.accepted.required',
    ])
  })

  it('logs in with any password, but not an empty one (AU-04)', () => {
    expect(logInSchema.safeParse({ email: 'ana@example.com', password: 'x' }).success).toBe(true)
    expect(
      logInSchema.safeParse({ email: 'ana@example.com', password: '' }).error?.issues[0]?.message,
    ).toBe('auth.fields.password.required')
  })
})
