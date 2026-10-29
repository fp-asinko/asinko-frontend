/**
 * A username to start from, out of an email (specs/auth AU-11, design.md § 11): `Ana.Perez@x.com`
 * suggests `ana_perez`. Only what the backend takes (3 to 30 letters, numbers or _); too short, none.
 */
export function suggestUsername(email: string | null | undefined): string | null {
  const local = email?.split('@')[0] ?? ''
  const username = local
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30)
    .replace(/_$/, '')
  return username.length >= 3 ? username : null
}
