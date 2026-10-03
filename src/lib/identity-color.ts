/** Number of identity hues in the theme (--avatar-0 … --avatar-7 in globals.css). */
export const IDENTITY_COLORS = 8

/**
 * Stable palette slot for a user or community (FC-01): FNV-1a over the handle, without the mention
 * prefix and case-insensitive, so the same person gets the same color on every screen and session.
 * Keyed by the handle until the contract exposes a stable id everywhere (specs/feed-cards § 3).
 */
export function identityIndex(key: string): number {
  let hash = 0x811c9dc5
  for (const char of key.replace(/^[@#$]/, '').toLowerCase()) {
    hash ^= char.codePointAt(0) ?? 0
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0) % IDENTITY_COLORS
}
