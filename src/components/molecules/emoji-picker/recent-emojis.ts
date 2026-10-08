/** The emojis chosen last, in this browser (specs/emoji-picker EP-05). */
const KEY = 'asinko:recent-emojis'
export const RECENT_MAX = 16

/** The recent emojis, newest first. Nothing when the storage is blocked or holds something odd. */
export function readRecentEmojis(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(stored)
      ? stored.filter((each): each is string => typeof each === 'string').slice(0, RECENT_MAX)
      : []
  } catch {
    return []
  }
}

/** Puts an emoji first, once, keeping the last 16. A blocked storage just forgets. */
export function rememberEmoji(emoji: string): string[] {
  const next = [emoji, ...readRecentEmojis().filter((each) => each !== emoji)].slice(0, RECENT_MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Private window or blocked storage: the recent ones last only this visit.
  }
  return next
}
