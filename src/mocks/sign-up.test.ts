// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { PROFILES } from './fixtures/users'
import { createMockProfile, MOCK_TAKEN_USERNAME } from './sign-up'

const noRequest = { params: {}, query: {} }
const token = (id = crypto.randomUUID()) => ({ id, accessToken: `mock-access.${id}.test` })
const body = (username: string) => ({ username, ageConfirmed: true, termsAccepted: true })

describe('the mocked POST /users (specs/auth design.md § 9)', () => {
  it('creates the profile of the Bearer user, who then has a page', () => {
    const { id, accessToken } = token()
    const username = `new_${id.slice(0, 8)}`
    const response = createMockProfile({ ...noRequest, body: body(username), accessToken })
    expect(response.status).toBe(201)
    expect(PROFILES.find((each) => each.id === id)?.username).toBe(username)
  })

  it('answers as the backend: no Bearer, invalid, terms, taken, twice', () => {
    const { accessToken } = token()
    const code = (input: unknown, auth: string | null = accessToken) =>
      (
        createMockProfile({ ...noRequest, body: input, accessToken: auth }).body as {
          error: { code: string }
        }
      ).error.code
    expect(code(body('ana_92'), null)).toBe('UNAUTHENTICATED')
    expect(code(body('a-b'))).toBe('INVALID_USERNAME')
    expect(code({ username: 'ana_92', ageConfirmed: true })).toBe('TERMS_NOT_ACCEPTED')
    expect(code(body(MOCK_TAKEN_USERNAME))).toBe('USERNAME_TAKEN')
    expect(code(body('MARIA'))).toBe('USERNAME_TAKEN')
    const demo = {
      ...noRequest,
      body: body('fresh_demo'),
      accessToken: token(PROFILES[0]!.id).accessToken,
    }
    expect((createMockProfile(demo).body as { error: { code: string } }).error.code).toBe(
      'CONFLICT',
    )
  })
})
