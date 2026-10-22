// Types only: a value from the contract would bring zod to the browser (~90 KB, seo.md).
import type { ImpressionEvent } from '@/lib/api/contract'

// The feed's impressions waiting to go (specs/explore-v1 § 3), shared by every page of every feed:
// one queue per tab, by requestId. Browser only; no React.

export const IMPRESSIONS_ENDPOINT = '/api/impressions'
/** The contract's MAX_IMPRESSION_EVENTS (a test keeps them equal). */
export const BATCH_SIZE = 100
/** How long what was seen waits for company before it goes. */
export const FLUSH_MS = 10_000

const pending = new Map<string, ImpressionEvent[]>()
let timer: ReturnType<typeof setTimeout> | undefined
let listening = false

/**
 * One batch to the server. A beacon is the only request the browser keeps once the page is gone
 * (EX-07); as text/plain, a type every browser takes. Without one, a keepalive fetch. A failure is
 * dropped: never retried, never shown (EX-09).
 */
function post(requestId: string, events: ImpressionEvent[]) {
  const body = JSON.stringify({ requestId, events })
  try {
    if (navigator.sendBeacon?.(IMPRESSIONS_ENDPOINT, body)) return
  } catch {
    // A beacon the browser refuses: try the fetch.
  }
  fetch(IMPRESSIONS_ENDPOINT, {
    method: 'POST',
    body,
    keepalive: true,
    credentials: 'same-origin',
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
  }).catch(() => {})
}

/** Sends everything waiting, in batches of up to 100 per page. */
export function flushImpressions() {
  clearTimeout(timer)
  timer = undefined
  for (const [requestId, events] of pending) {
    pending.delete(requestId)
    for (let start = 0; start < events.length; start += BATCH_SIZE) {
      post(requestId, events.slice(start, start + BATCH_SIZE))
    }
  }
}

/** Leaving or hiding the page sends what is waiting: closing a tab first hides it. */
function listen() {
  if (listening) return
  listening = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushImpressions()
  })
  window.addEventListener('pagehide', flushImpressions)
}

/** Queues what was seen or opened of a feed page; it goes in a batch, soon. */
export function trackImpression(requestId: string, event: ImpressionEvent) {
  listen()
  const events = pending.get(requestId) ?? []
  events.push(event)
  pending.set(requestId, events)
  if (events.length >= BATCH_SIZE) flushImpressions()
  else timer ??= setTimeout(flushImpressions, FLUSH_MS)
}
