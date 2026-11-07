import { describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { communityBySlug } from '@/mocks/fixtures/communities'
import { updateGroupAs } from './update-group'

// The real client against the mock routes; without a token they answer as the demo user.
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { MOCK_ROUTES } = await import('@/mocks/handlers')
  return {
    apiRequest: createApiClient({
      baseUrl: 'http://mock',
      fetch: () => Promise.reject(new Error('offline')),
      mocks: MOCK_ROUTES,
    }),
  }
})

describe('updateGroupAs (specs/community-edit CE-03, CE-06)', () => {
  it('saves the changes of a group the demo moderates', async () => {
    expect(
      await updateGroupAs(DEMO_USER.id, 'trading-on-chain', { rules: 'No shilling.' }),
    ).toEqual({ ok: true, data: null })
    expect(communityBySlug('trading-on-chain')?.rules).toBe('No shilling.')
  })

  it('answers the refusal of a group the demo does not moderate', async () => {
    expect(await updateGroupAs(DEMO_USER.id, 'defi', { rules: 'x' })).toMatchObject({
      ok: false,
      code: 'NOT_MODERATOR',
    })
  })
})
