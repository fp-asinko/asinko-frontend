import { afterEach, describe, expect, it, vi } from 'vitest'

const sentry = vi.hoisted(() => ({ captureException: vi.fn() }))
const clientEnv = vi.hoisted(() => ({ NEXT_PUBLIC_SENTRY_DSN: undefined as string | undefined }))
vi.mock('@sentry/nextjs', () => sentry)
vi.mock('@/env.client', () => ({ clientEnv }))

describe('reportError (F-35)', () => {
  afterEach(() => sentry.captureException.mockClear())

  it('does nothing without a DSN', async () => {
    clientEnv.NEXT_PUBLIC_SENTRY_DSN = undefined
    const { reportError } = await import('./report-error')
    reportError(new Error('boom'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(sentry.captureException).not.toHaveBeenCalled()
  })

  it('reports to Sentry when a DSN is set', async () => {
    clientEnv.NEXT_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/1'
    const { reportError } = await import('./report-error')
    const error = new Error('boom')
    reportError(error)
    await vi.waitFor(() => expect(sentry.captureException).toHaveBeenCalledWith(error))
  })
})
