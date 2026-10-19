import { z } from 'zod'
import { WIDGET_LIMITS as L } from '@/lib/api/contract/widgets'
import { toWidgetLink } from '@/lib/widget-link'

// What a moderator writes in "Edit widgets" (specs/community-widgets CW-10), the same rules in the
// forms and in the Server Action, P-028's limits. Messages are translation keys (i18n.md).

const E = 'communities.widgets.errors.'

const title = z
  .string()
  .trim()
  .min(1, E + 'titleRequired')
  .max(L.title, E + 'tooLong')
const optionalTitle = z
  .string()
  .trim()
  .max(L.title, E + 'tooLong')
const link = z
  .string()
  .trim()
  .max(L.url, E + 'tooLong')
  .refine((value) => toWidgetLink(value) !== null, E + 'link')
const optionalLink = z
  .string()
  .trim()
  .max(L.url, E + 'tooLong')
  .refine((value) => value === '' || toWidgetLink(value) !== null, E + 'link')
const date = z.string().refine((value) => !Number.isNaN(Date.parse(value)), E + 'date')

export const textWidgetSchema = z.object({
  type: z.literal('TEXT'),
  title,
  body: z
    .string()
    .trim()
    .min(1, E + 'bodyRequired')
    .max(L.textBody, E + 'tooLong'),
})

export const rulesWidgetSchema = z.object({
  type: z.literal('RULES'),
  title,
  rules: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, E + 'ruleRequired')
          .max(L.ruleTitle, E + 'tooLong'),
        description: z
          .string()
          .trim()
          .max(L.ruleDescription, E + 'tooLong'),
      }),
    )
    .min(1, E + 'atLeastOne')
    .max(L.rules, E + 'tooMany'),
})

export const buttonsWidgetSchema = z.object({
  type: z.literal('BUTTONS'),
  title,
  buttons: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .min(1, E + 'labelRequired')
          .max(L.buttonLabel, E + 'tooLong'),
        url: link,
      }),
    )
    .min(1, E + 'atLeastOne')
    .max(L.buttons, E + 'tooMany'),
})

export const communitiesWidgetSchema = z.object({
  type: z.literal('COMMUNITIES'),
  title,
  communityIds: z
    .array(z.uuid())
    .min(1, E + 'atLeastOne')
    .max(L.communities, E + 'tooMany')
    .refine((ids) => new Set(ids).size === ids.length, E + 'repeated'),
})

export const imagesWidgetSchema = z.object({
  type: z.literal('IMAGES'),
  title: optionalTitle,
  images: z
    .array(
      z.object({
        imageUrl: z.string().min(1).max(L.url),
        alt: z
          .string()
          .trim()
          .min(1, E + 'altRequired')
          .max(L.imageAlt, E + 'tooLong'),
        linkUrl: optionalLink,
      }),
    )
    .min(1, E + 'atLeastOne')
    .max(L.images, E + 'tooMany'),
})

export const calendarWidgetSchema = z.object({
  type: z.literal('CALENDAR'),
  title,
  events: z
    .array(
      z
        .object({
          title: z
            .string()
            .trim()
            .min(1, E + 'eventRequired')
            .max(L.eventTitle, E + 'tooLong'),
          startsAt: date,
          endsAt: z.union([z.literal(''), date]),
          allDay: z.boolean(),
          location: z
            .string()
            .trim()
            .max(L.eventLocation, E + 'tooLong'),
          url: optionalLink,
        })
        .refine(
          (event) => !event.endsAt || Date.parse(event.endsAt) >= Date.parse(event.startsAt),
          {
            message: E + 'endBeforeStart',
            path: ['endsAt'],
          },
        ),
    )
    .min(1, E + 'atLeastOne')
    .max(L.events, E + 'tooMany'),
})

/** One widget as a form leaves it, with its id when it already exists. */
export const widgetInputSchema = z
  .discriminatedUnion('type', [
    textWidgetSchema,
    rulesWidgetSchema,
    buttonsWidgetSchema,
    communitiesWidgetSchema,
    imagesWidgetSchema,
    calendarWidgetSchema,
  ])
  .and(z.object({ id: z.string().min(1).max(100).optional() }))

/** What "Save" sends (CW-12): the group and its whole list, in order. */
export const saveWidgetsSchema = z.object({
  slug: z.string().min(1).max(64),
  items: z.array(widgetInputSchema).max(L.widgets, E + 'tooManyWidgets'),
})

export type WidgetInputData = z.infer<typeof widgetInputSchema>
