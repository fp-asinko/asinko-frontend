/** "Complete your profile" hidden in this browser (specs/profile-showcase PS-03). */
export const CHECKLIST_COOKIE = 'asinko-profile-checklist'

const YEAR = 60 * 60 * 24 * 365

/** Said on the window when the cookie changes: the card behind "Edit profile" follows it. */
export const CHECKLIST_EVENT = 'asinko-checklist-change'

/**
 * Written by the browser (PS-13, PS-14): a preference of the interface, nothing sensitive, so Undo
 * needs no server and "Edit profile" knows whether it is hidden. The page reads it with cookies().
 */
export function writeChecklistHidden(hidden: boolean): void {
  document.cookie = hidden
    ? `${CHECKLIST_COOKIE}=hidden; max-age=${YEAR}; path=/; samesite=lax`
    : `${CHECKLIST_COOKIE}=; max-age=0; path=/; samesite=lax`
  window.dispatchEvent(new CustomEvent(CHECKLIST_EVENT, { detail: hidden }))
}

export function readChecklistHidden(): boolean {
  return document.cookie.split('; ').includes(`${CHECKLIST_COOKIE}=hidden`)
}
