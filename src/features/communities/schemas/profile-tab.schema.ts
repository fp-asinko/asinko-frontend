import { z } from 'zod'

/** The tab of a person's page (specs/profile-track-record PT-04): Posts unless ?tab=theses. */
export const profileTabSchema = z
  .object({ tab: z.enum(['posts', 'theses']).catch('posts') })
  .catch({ tab: 'posts' })

export type ProfileTab = z.output<typeof profileTabSchema>['tab']

export function parseProfileTab(searchParams: unknown): ProfileTab {
  return profileTabSchema.parse(searchParams ?? {}).tab
}
