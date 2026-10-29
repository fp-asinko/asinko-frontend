/**
 * What can be in the list: posts and thoughts today (specs/thoughts); polls, theses and alerts when
 * they have a page.
 */
export type RecentKind = 'post' | 'thought'

/** A post opened lately (specs/recently-viewed § 2): what the right column shows of it. */
export type RecentItem = {
  id: string
  /** Its page, without the locale: /post/{id}/{slug}. */
  href: string
  /** Where it was published: $BTC, #macro, or @author in a personal channel. */
  label: string
  title: string
  kind: RecentKind
  score: number
  comments: number
  /** ISO date of the last opening. */
  viewedAt: string
}

const KEY = 'asinko:recently-viewed'
/**
 * Exactly a post's page, /post/{id} or /post/{id}/{slug}, the slug empty for a title with no
 * letters (only emojis): no dots, query or hash.
 */
const POST_PAGE = /^\/post\/[\w-]+(\/[\w-]*)?$/
/** Longer than a real title or handle: something else wrote it. */
const TEXT_MAX = 300
/** Fired in this tab when the list changes; other tabs hear the `storage` event. */
const CHANGED = 'asinko:recently-viewed'
export const RECENT_MAX = 10
const EMPTY: readonly RecentItem[] = []

/** The browser's storage is not trusted: each field checked, and only our own post pages. */
function isRecentItem(value: unknown): value is RecentItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.href === 'string' &&
    POST_PAGE.test(item.href) &&
    typeof item.label === 'string' &&
    item.label.length <= TEXT_MAX &&
    typeof item.title === 'string' &&
    // Something to show: a thought saved before its text was (specs/thoughts) is left out; opened
    // again, it comes back with it (PO, 2026-10-29).
    item.title.trim() !== '' &&
    item.title.length <= TEXT_MAX &&
    (item.kind === 'post' || item.kind === 'thought') &&
    Number.isFinite(item.score) &&
    Number.isFinite(item.comments) &&
    typeof item.viewedAt === 'string' &&
    !Number.isNaN(Date.parse(item.viewedAt))
  )
}

function rawList(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function parse(raw: string | null): readonly RecentItem[] {
  if (!raw) return EMPTY
  try {
    const stored: unknown = JSON.parse(raw)
    return Array.isArray(stored) ? stored.filter(isRecentItem).slice(0, RECENT_MAX) : EMPTY
  } catch {
    return EMPTY
  }
}

// The last read, to hand useSyncExternalStore the same array while nothing changed.
let cache: { raw: string | null; items: readonly RecentItem[] } = { raw: null, items: EMPTY }

/** The list, newest first. Empty when nothing was seen or the storage is blocked. */
export function readRecent(): readonly RecentItem[] {
  const raw = rawList()
  if (raw !== cache.raw) cache = { raw, items: parse(raw) }
  return cache.items
}

/** The same list for the server render: nothing (the browser has it). */
export function readRecentOnServer(): readonly RecentItem[] {
  return EMPTY
}

function write(items: readonly RecentItem[]) {
  try {
    if (items.length === 0) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // Private window or blocked storage: the list is just not kept.
    return
  }
  window.dispatchEvent(new Event(CHANGED))
}

/** Opened now: first in the list, once, with its latest numbers, keeping the last 10 (RV-03). */
export function recordRecent(item: Omit<RecentItem, 'viewedAt'>, now = new Date()) {
  const rest = readRecent().filter((each) => each.id !== item.id)
  write([{ ...item, viewedAt: now.toISOString() }, ...rest].slice(0, RECENT_MAX))
}

/** "Clear" (RV-05). */
export function clearRecent() {
  write(EMPTY)
}

/** Calls back when the list changes, in this tab or another (RV-06). */
export function subscribeRecent(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) onChange()
  }
  window.addEventListener(CHANGED, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGED, onChange)
    window.removeEventListener('storage', onStorage)
  }
}
