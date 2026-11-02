// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { communityBySlug } from './fixtures/communities'
import { PROFILES } from './fixtures/users'
import { checkMockUsername, createMockProfile, MOCK_TAKEN_USERNAME } from './sign-up'

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
    // With its personal channel, as the backend: its page exists.
    expect(communityBySlug(username)).toMatchObject({
      type: 'PERSONAL_CHANNEL',
      createdByProfileId: id,
    })
  })

  it('does not keep a display name, as the backend (P-037)', () => {
    const { id, accessToken } = token()
    const username = `new_${id.slice(0, 8)}`
    createMockProfile({
      ...noRequest,
      body: { ...body(username), displayName: 'Ana Pérez' },
      accessToken,
    })
    expect(PROFILES.find((each) => each.id === id)?.displayName).toBeNull()
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

describe('the mocked GET /usernames/{username} (P-035)', () => {
  const check = (username: string, accessToken: string | null = 'mock-access.x.test') =>
    checkMockUsername({ ...noRequest, params: { username }, body: undefined, accessToken })

  it('says taken for someone’s in any case and the e2e’s, free otherwise', () => {
    expect(check('MARIA').body).toEqual({ available: false })
    expect(check(MOCK_TAKEN_USERNAME).body).toEqual({ available: false })
    expect(check('nobody_has_this').body).toEqual({ available: true })
  })

  it('answers 422 to an invalid one and 401 without a session', () => {
    expect(check('a-b').status).toBe(422)
    expect(check('ana_92', null).status).toBe(401)
  })
})

describe('a new mocked account writes as itself (specs/auth design.md § 14)', () => {
  it('uploads its photo and saves it in its own profile, never in another', async () => {
    const { signProfileImageUpload } = await import('./profile-image')
    const { updateUser } = await import('./profile-edit')
    const { mockCaller } = await import('./auth')
    const { id, accessToken } = token()
    createMockProfile({ ...noRequest, body: body(`pic_${id.slice(0, 8)}`), accessToken })
    const caller = mockCaller(accessToken)
    expect(caller).toBe(id)

    const upload = { userId: id, contentType: 'image/webp', size: 1_000 }
    expect(signProfileImageUpload('avatar', upload, caller).status).toBe(200)
    expect(signProfileImageUpload('avatar', upload).status).toBe(403)
    const saved = updateUser(id, { avatarUrl: '/mocks/avatar-demo.svg' }, caller)
    expect(saved).toMatchObject({ status: 200, body: { avatarUrl: '/mocks/avatar-demo.svg' } })
    expect(updateUser(PROFILES[0]!.id, { bio: 'x' }, caller).status).toBe(403)
  })
})
