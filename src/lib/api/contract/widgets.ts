import { z } from 'zod'
import { communitySummarySchema } from './content'

// P-028 (proposal, specs/community-widgets): the blocks a group's moderators put in its right
// column, as Reddit's widgets. Raw backend shapes; the limits are the proposal's.

/** The limits of each widget (P-028), shared by the mocks and the editor's schemas. */
export const WIDGET_LIMITS = {
  widgets: 20,
  title: 50,
  textBody: 5000,
  rules: 15,
  ruleTitle: 100,
  ruleDescription: 500,
  buttons: 10,
  buttonLabel: 30,
  communities: 10,
  images: 10,
  imageAlt: 300,
  events: 20,
  eventTitle: 100,
  eventLocation: 100,
  url: 2048,
} as const

export const WIDGET_TYPES = [
  'TEXT',
  'RULES',
  'BUTTONS',
  'COMMUNITIES',
  'IMAGES',
  'CALENDAR',
] as const

export type WidgetType = (typeof WIDGET_TYPES)[number]

const base = { id: z.string().min(1), title: z.string() }

/** A widget as GET and PUT answer it: a group in a list of communities comes resolved. */
export const widgetSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('TEXT'), body: z.string() }),
  z.object({
    ...base,
    type: z.literal('RULES'),
    rules: z.array(z.object({ title: z.string(), description: z.string() })),
  }),
  z.object({
    ...base,
    type: z.literal('BUTTONS'),
    buttons: z.array(z.object({ label: z.string(), url: z.string() })),
  }),
  z.object({
    ...base,
    type: z.literal('COMMUNITIES'),
    communities: z.array(communitySummarySchema.extend({ memberCount: z.number().int() })),
  }),
  z.object({
    ...base,
    type: z.literal('IMAGES'),
    images: z.array(
      z.object({ imageUrl: z.string(), alt: z.string(), linkUrl: z.string().nullable() }),
    ),
  }),
  z.object({
    ...base,
    type: z.literal('CALENDAR'),
    events: z.array(
      z.object({
        title: z.string(),
        startsAt: z.iso.datetime({ offset: true }),
        endsAt: z.iso.datetime({ offset: true }).nullable(),
        allDay: z.boolean(),
        location: z.string().nullable(),
        url: z.string().nullable(),
      }),
    ),
  }),
])

/** The list takes any item: one malformed or of an unknown type is dropped, not the list. */
export const widgetListSchema = z.object({ items: z.array(z.unknown()) })

export type RawWidget = z.infer<typeof widgetSchema>

/**
 * POST /api/v1/uploads/community-image (P-029, proposal): where to put a widget's image, the same
 * signed URL as a post image. Only a moderator of that community.
 */
export { postImageUploadSchema as communityImageUploadSchema } from './uploads'
