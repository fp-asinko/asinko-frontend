import { describe, expect, it } from 'vitest'
import { PROFILES, profileSchema } from './fixtures/profiles'
import { MOCK_ROUTES } from './handlers'

// F-37: mocks respect the contract. A fixture or handler output that breaks its schema fails here.
describe('mock fixtures', () => {
  it('profiles match the profile schema', () => {
    for (const profile of PROFILES) expect(profileSchema.safeParse(profile).success).toBe(true)
  })

  it.each(MOCK_ROUTES.map((route) => [`${route.method} ${route.path}`, route] as const))(
    '%s returns a body that matches its schema',
    async (_name, route) => {
      const { status, body } = await route.handler(route.example)
      expect(status).toBeGreaterThanOrEqual(200)
      expect(status).toBeLessThan(300)
      expect(route.schema.safeParse(body).success).toBe(true)
    },
  )
})
