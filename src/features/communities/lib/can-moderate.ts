import type { CommunityPage } from '../communities.types'

/** Whether the viewer moderates the group (specs/community-widgets CW-08); the backend decides. */
export function canModerate(page: Pick<CommunityPage, 'viewerMembership'>): boolean {
  return page.viewerMembership === 'MODERATOR' || page.viewerMembership === 'PRINCIPAL_MODERATOR'
}
