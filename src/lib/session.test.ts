import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'

const env = vi.hoisted(() => ({ API_MOCKS: 'off' as 'off' | 'missing' | 'all' }))
vi.mock('@/env', () => ({ env }))
const jar = vi.hoisted(() => ({ guest: undefined as string | undefined }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'asinko-mock-guest' && jar.guest ? { value: jar.guest } : undefined,
  }),
}))

describe('getViewer (F-38)', () => {
  afterEach(() => {
    vi.resetModules()
    jar.guest = undefined
  })

  it('is the demo user when mocks are on', async () => {
    env.API_MOCKS = 'all'
    const { getViewer } = await import('./session')
    expect(await getViewer()).toEqual(DEMO_USER)
  })

  it('is nobody when only the missing routes are mocked: the real backend needs a login', async () => {
    env.API_MOCKS = 'missing'
    const { getViewer } = await import('./session')
    expect(await getViewer()).toBeNull()
  })

  it('is nobody without mocks and without login', async () => {
    env.API_MOCKS = 'off'
    const { getViewer } = await import('./session')
    expect(await getViewer()).toBeNull()
  })

  it('is nobody when the browser asks to be a guest, with every route mocked (T-05)', async () => {
    env.API_MOCKS = 'all'
    jar.guest = '1'
    const { getViewer } = await import('./session')
    expect(await getViewer()).toBeNull()
  })

  it('reads the guest cookie only with every route mocked: never with a real backend', async () => {
    env.API_MOCKS = 'missing'
    jar.guest = '1'
    const { getViewer } = await import('./session')
    expect(await getViewer()).toBeNull()
  })
})
