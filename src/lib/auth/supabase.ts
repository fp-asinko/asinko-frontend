import 'server-only'
import { env } from '@/env'
import { MOCK_SUPABASE_URL, mockGoogleUrl, mockSupabaseFetch } from '@/mocks/auth'
import { createSupabaseAuth, type SupabaseAuth } from './supabase-auth'

/**
 * The app's Supabase Auth (specs/auth): the simulated one with every route mocked (CI), the real
 * one with its configuration, or none (development without Supabase: logging in says it is
 * unavailable). Production cannot start without it (src/lib/env-schema.ts, AU-20).
 */
export const supabaseAuth: SupabaseAuth | null =
  env.API_MOCKS === 'all'
    ? createSupabaseAuth({
        url: MOCK_SUPABASE_URL,
        anonKey: 'mock',
        fetch: mockSupabaseFetch,
        timeoutMs: env.API_TIMEOUT_MS,
        authorizeUrl: mockGoogleUrl,
      })
    : env.SUPABASE_URL && env.SUPABASE_ANON_KEY
      ? createSupabaseAuth({
          url: env.SUPABASE_URL,
          anonKey: env.SUPABASE_ANON_KEY,
          timeoutMs: env.API_TIMEOUT_MS,
        })
      : null
