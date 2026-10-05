import { env } from '@/env'
import { mockDelay } from '@/lib/api'
import { getViewer } from '@/lib/session'
import { getInterests } from '../lib/interests-api'
import { DEV_SAMPLE_ASSETS } from '../interests.constants'
import { InterestsSections } from './interests-sections'

/** Loads the column's data on the server (from the API: mocks today, the backend tomorrow). */
export async function InterestsSidebar() {
  // A slow backend on demand, for the e2e of the streaming (mocks only, never production).
  await mockDelay()
  const interests = await getInterests(await getViewer(), {
    // With the real backend and mocked assets (development only), a test account that follows no
    // asset still shows some tiles. src/env.ts refuses API_MOCKS=missing in production.
    sampleAssets: env.API_MOCKS === 'missing' ? DEV_SAMPLE_ASSETS : [],
  })
  return <InterestsSections interests={interests} />
}
