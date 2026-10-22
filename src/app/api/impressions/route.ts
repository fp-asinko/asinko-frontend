import { receiveImpressions } from '@/features/feed/lib/receive-impressions'

// The feed's impressions (specs/explore-v1 § 3): a beacon from the browser, sent on to the backend.
export function POST(request: Request) {
  return receiveImpressions(request)
}
