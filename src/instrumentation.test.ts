// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

const sentry = vi.hoisted(() => ({ init: vi.fn(), captureRequestError: vi.fn() }))
const env = vi.hoisted(() => ({
  SENTRY_DSN: undefined as string | undefined,
  APP_ENV: 'preview',
  NEXT_RUNTIME: 'nodejs',
}))
vi.mock('@sentry/nextjs', () => sentry)
vi.mock('./env', () => ({ env }))

describe('register (F-35)', () => {
  afterEach(() => sentry.init.mockClear())

  it('does not initialize Sentry without a DSN', async () => {
    env.SENTRY_DSN = undefined
    const { register } = await import('./instrumentation')
    await register()
    expect(sentry.init).not.toHaveBeenCalled()
  })

  it('does not initialize Sentry outside the Node.js runtime', async () => {
    env.NEXT_RUNTIME = 'edge'
    env.SENTRY_DSN = 'https://key@o1.ingest.sentry.io/1'
    const { register } = await import('./instrumentation')
    await register()
    expect(sentry.init).not.toHaveBeenCalled()
    env.NEXT_RUNTIME = 'nodejs'
  })

  it('initializes Sentry on the Node.js runtime when a DSN is set', async () => {
    env.SENTRY_DSN = 'https://key@o1.ingest.sentry.io/1'
    const { register } = await import('./instrumentation')
    await register()
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: env.SENTRY_DSN, sendDefaultPii: false }),
    )
  })
})
