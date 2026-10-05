import { mockDelay } from '@/lib/api'
import { getViewer } from '@/lib/session'
import { getInterests } from '../lib/interests-api'
import { InterestsSections } from './interests-sections'

/** Loads the column's data on the server (from the API: mocks today, the backend tomorrow). */
export async function InterestsSidebar() {
  // A slow backend on demand, for the e2e of the streaming (mocks only, never production).
  await mockDelay()
  const interests = await getInterests(await getViewer())
  return <InterestsSections interests={interests} />
}
