/**
 * The email written in the log in form, for the recovery form on /login (specs/password-recovery
 * PR-02): switching mode is a client navigation, and this module outlives it. Never in the URL:
 * an email is personal data (security.md § 7).
 */
let remembered = ''

export function rememberEmail(email: string): void {
  remembered = email
}

export function rememberedEmail(): string {
  return remembered
}
