import { z } from 'zod'

/**
 * The tab of a person's page (specs/profile-track-record PT-04, specs/backend-adoption BK-03):
 * Posts unless ?tab=theses or ?tab=replies.
 */
export const profileTabSchema = z
  .object({ tab: z.enum(['posts', 'theses', 'replies']).catch('posts') })
  .catch({ tab: 'posts' })

export type ProfileTab = z.output<typeof profileTabSchema>['tab']

export function parseProfileTab(searchParams: unknown): ProfileTab {
  return profileTabSchema.parse(searchParams ?? {}).tab
}
