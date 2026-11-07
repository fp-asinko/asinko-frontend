import { describe, expect, it, vi } from 'vitest'
import type { CreateGroupInput } from '../schemas/create-group.schema'
import { DEMO_USER } from '@/mocks/demo-user'
import { createGroupAs } from './create-group'
import { updateGroupImageAs } from './update-group-images'

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

const group = (name: string, slug: string): CreateGroupInput => ({
  name,
  slug,
  description: undefined,
  rules: undefined,
  mainUrl: undefined,
})

describe('createGroupAs and updateGroupImageAs (specs/community-create CG-09, CG-11)', () => {
  it('creates the group and answers its id and slug; a taken slug is a SLUG_TAKEN', async () => {
    const created = await createGroupAs(DEMO_USER.id, group('Lib Test', 'lib-test'))
    expect(created).toMatchObject({ ok: true, data: { slug: 'lib-test' } })
    expect(await createGroupAs(DEMO_USER.id, group('Again', 'lib-test'))).toMatchObject({
      ok: false,
      code: 'SLUG_TAKEN',
    })
  })

  it('saves an image and answers the URL the group keeps', async () => {
    await createGroupAs(DEMO_USER.id, group('With Banner', 'with-banner'))
    expect(await updateGroupImageAs(DEMO_USER.id, 'with-banner', 'banner', '/b.webp')).toEqual({
      ok: true,
      data: { imageUrl: '/b.webp' },
    })
  })
})
