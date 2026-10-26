/**
 * A handle without its symbol: "#macro" → "macro", "@maria" → "maria", "$BTC" → "BTC". The lists of
 * the columns show names alone (PO, 2026-10-26): the avatar, the section and the link already say
 * what each one is. Mentions in a text keep their own rule (post-markdown).
 */
export function plainHandle(handle: string): string {
  return handle.replace(/^[@#$]/, '')
}
