import 'server-only'
import { headers } from 'next/headers'
import { env } from '@/env'

/** Header an e2e test sends to make the mocked backend slow (specs/feed-navigation § 5). */
export const MOCK_DELAY_HEADER = 'x-mock-delay'
const MAX_DELAY_MS = 5000

/**
 * Waits as long as the request asks, to test what a slow backend looks like. Only with every
 * route mocked (API_MOCKS=true), which src/env.ts refuses in production: a no-op anywhere else.
 */
export async function mockDelay(): Promise<void> {
  if (env.API_MOCKS !== 'all') return
  const ms = Number((await headers()).get(MOCK_DELAY_HEADER))
  if (!Number.isFinite(ms) || ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, Math.min(ms, MAX_DELAY_MS)))
}
