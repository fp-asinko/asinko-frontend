import type { CommunityPage } from '../communities.types'

export type GroupStep = { id: 'images' | 'description' | 'rules' | 'post'; done: boolean }

/**
 * The steps of "Get your group started" (specs/community-edit CE-07), in their order: a photo or a
 * banner, a description, rules and the first post.
 */
export function groupSteps(
  page: Pick<CommunityPage, 'avatarUrl' | 'bannerUrl' | 'description' | 'rules'>,
  hasPosts: boolean,
): GroupStep[] {
  return [
    { id: 'images', done: Boolean(page.avatarUrl || page.bannerUrl) },
    { id: 'description', done: Boolean(page.description) },
    { id: 'rules', done: Boolean(page.rules) },
    { id: 'post', done: hasPosts },
  ]
}
