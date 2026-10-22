import 'server-only'
import { getViewer } from '@/lib/session'
import { impressionsInputSchema } from '../schemas/impressions.schema'
import { reportImpressionsAs } from './impressions-api'

/** 100 events of ~110 bytes each fit with room to spare. */
export const MAX_IMPRESSIONS_BYTES = 16 * 1024

const CONTENT_TYPES = ['application/json', 'text/plain']

const status = (code: number) => new Response(null, { status: code })

/**
 * The browser's own origin, as Next checks it for Server Actions: the Origin header against the
 * host the request reached (behind a proxy, x-forwarded-host). A missing Origin is refused: every
 * browser sends it on a POST.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/**
 * POST /api/impressions (specs/explore-v1 § 3, D-1): what a feed page showed, from the browser's
 * beacon to the backend. Its own route, not a Server Action, because only a beacon survives closing
 * the tab. Checks the origin, the size and the body, takes the userId from the session, and
 * answers 204 whatever the backend says: an impression that fails is never noticed (EX-09).
 */
export async function receiveImpressions(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return status(403)

  // sendBeacon sends text/plain (a safelisted type in every browser); fetch, JSON.
  const type = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (!type || !CONTENT_TYPES.includes(type)) return status(415)

  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_IMPRESSIONS_BYTES) return status(413)
  const text = await request.text()
  if (text.length > MAX_IMPRESSIONS_BYTES) return status(413)

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return status(400)
  }
  const parsed = impressionsInputSchema.safeParse(raw)
  if (!parsed.success) return status(400)

  const viewer = await getViewer()
  await reportImpressionsAs(viewer?.id ?? null, parsed.data)
  return status(204)
}
