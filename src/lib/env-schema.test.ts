import { describe, expect, it } from 'vitest'
import { envSchema, MOCKS_IN_PRODUCTION_ERROR } from './env-schema'

const validPreview = {
  APP_ENV: 'preview',
  API_BASE_URL: 'https://api.example.com',
  API_MOCKS: 'true',
  NEXT_PUBLIC_SITE_URL: 'https://preview.example.com',
}

function issuesOf(input: Record<string, unknown>) {
  const result = envSchema.safeParse(input)
  return result.success ? [] : result.error.issues
}

describe('envSchema', () => {
  it('accepts a valid preview config with mocks', () => {
    const result = envSchema.safeParse(validPreview)
    expect(result.success).toBe(true)
    expect(result.data?.API_MOCKS).toBe('all')
  })

  it('defaults API_MOCKS to false', () => {
    const { API_MOCKS: _omitted, ...withoutMocks } = validPreview
    expect(envSchema.parse(withoutMocks).API_MOCKS).toBe('off')
  })

  it('rejects a missing API_BASE_URL', () => {
    const { API_BASE_URL: _omitted, ...withoutApi } = validPreview
    expect(issuesOf(withoutApi).map((issue) => issue.path[0])).toContain('API_BASE_URL')
  })

  it('rejects an invalid URL', () => {
    const paths = issuesOf({ ...validPreview, API_BASE_URL: 'not-a-url' }).map((i) => i.path[0])
    expect(paths).toContain('API_BASE_URL')
  })

  it('rejects an unknown APP_ENV', () => {
    const paths = issuesOf({ ...validPreview, APP_ENV: 'staging' }).map((i) => i.path[0])
    expect(paths).toContain('APP_ENV')
  })

  it('rejects mocks in production (F-30)', () => {
    const issues = issuesOf({ ...validPreview, APP_ENV: 'production', API_MOCKS: 'true' })
    expect(issues.map((issue) => issue.message)).toContain(MOCKS_IN_PRODUCTION_ERROR)
  })

  it('reads missing as mocking only the routes the backend lacks', () => {
    expect(envSchema.parse({ ...validPreview, API_MOCKS: 'missing' }).API_MOCKS).toBe('missing')
  })

  it('rejects partial mocks in production too', () => {
    const issues = issuesOf({ ...validPreview, APP_ENV: 'production', API_MOCKS: 'missing' })
    expect(issues.map((issue) => issue.message)).toContain(MOCKS_IN_PRODUCTION_ERROR)
  })

  it('waits 10 s for the API by default and accepts a longer timeout for development', () => {
    expect(envSchema.parse(validPreview).API_TIMEOUT_MS).toBe(10_000)
    expect(envSchema.parse({ ...validPreview, API_TIMEOUT_MS: '30000' }).API_TIMEOUT_MS).toBe(
      30_000,
    )
    expect(envSchema.safeParse({ ...validPreview, API_TIMEOUT_MS: '500' }).success).toBe(false)
  })

  it('accepts production without mocks', () => {
    const result = envSchema.safeParse({
      ...validPreview,
      APP_ENV: 'production',
      API_MOCKS: 'false',
    })
    expect(result.success).toBe(true)
  })
})
