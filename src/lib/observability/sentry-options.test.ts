import type { ErrorEvent } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'
import { buildSentryOptions, scrubEvent } from './sentry-options'

function eventWithPersonalData(): ErrorEvent {
  return {
    type: undefined,
    message: 'boom',
    user: { id: 'u1', email: 'juan@example.com', ip_address: '1.2.3.4' },
    request: {
      url: 'https://asinko.example/es/post/1?token=secret',
      cookies: { 'sb-access-token': 'secret' },
      headers: { authorization: 'Bearer secret', cookie: 'a=b' },
      query_string: 'token=secret',
      data: { password: 'secret' },
    },
  }
}

describe('scrubEvent (F-35)', () => {
  it('removes cookies, headers, query strings, bodies and user data', () => {
    const event = scrubEvent(eventWithPersonalData())
    expect(event.user).toBeUndefined()
    expect(event.request).toEqual({ url: 'https://asinko.example/es/post/1' })
    expect(JSON.stringify(event)).not.toContain('secret')
  })

  it('keeps the error itself', () => {
    expect(scrubEvent(eventWithPersonalData()).message).toBe('boom')
  })
})

describe('buildSentryOptions', () => {
  it('reports errors only, without personal data', () => {
    const options = buildSentryOptions('https://key@o1.ingest.sentry.io/1', 'preview')
    expect(options).toMatchObject({
      dsn: 'https://key@o1.ingest.sentry.io/1',
      environment: 'preview',
      sendDefaultPii: false,
      tracesSampleRate: 0,
      beforeSend: scrubEvent,
    })
  })
})
