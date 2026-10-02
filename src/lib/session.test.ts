import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'

const env = vi.hoisted(() => ({ API_MOCKS: 'off' as 'off' | 'missing' | 'all' }))
vi.mock('@/env', () => ({ env }))

describe('getViewer (F-38)', () => {
  afterEach(() => vi.resetModules())

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
})
