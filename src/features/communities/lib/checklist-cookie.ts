/** "Complete your profile" hidden in this browser (specs/profile-showcase PS-03). */
export const CHECKLIST_COOKIE = 'asinko-profile-checklist'

/** "Get your group started" hidden in this browser, one per group (specs/community-edit CE-08). */
export const groupChecklistCookie = (groupId: string) => `asinko-group-checklist-${groupId}`

const YEAR = 60 * 60 * 24 * 365

/** Said on the window when the profile's cookie changes: the card behind "Edit profile" follows it. */
export const CHECKLIST_EVENT = 'asinko-checklist-change'

/**
 * Written by the browser (PS-13, PS-14): a preference of the interface, nothing sensitive, so Undo
 * needs no server and "Edit profile" knows whether it is hidden. The page reads it with cookies().
 * A group's card passes its own cookie.
 */
export function writeChecklistHidden(hidden: boolean, cookie: string = CHECKLIST_COOKIE): void {
  document.cookie = hidden
    ? `${cookie}=hidden; max-age=${YEAR}; path=/; samesite=lax`
    : `${cookie}=; max-age=0; path=/; samesite=lax`
  if (cookie === CHECKLIST_COOKIE) {
    window.dispatchEvent(new CustomEvent(CHECKLIST_EVENT, { detail: hidden }))
  }
}

export function readChecklistHidden(cookie: string = CHECKLIST_COOKIE): boolean {
  return document.cookie.split('; ').includes(`${cookie}=hidden`)
}
