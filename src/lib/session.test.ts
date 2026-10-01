import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'

const env = vi.hoisted(() => ({ API_MOCKS: false }))
vi.mock('@/env', () => ({ env }))

describe('getViewer (F-38)', () => {
  afterEach(() => vi.resetModules())

  it('is the demo user when mocks are on', async () => {
    env.API_MOCKS = true
    const { getViewer } = await import('./session')
    expect(await getViewer()).toEqual(DEMO_USER)
  })

  it('is nobody without mocks and without login', async () => {
    env.API_MOCKS = false
    const { getViewer } = await import('./session')
    expect(await getViewer()).toBeNull()
  })
})
