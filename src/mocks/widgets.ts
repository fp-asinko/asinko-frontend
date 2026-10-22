import { WIDGET_LIMITS as L, WIDGET_TYPES, type RawWidget } from '@/lib/api/contract'
import { MOCK_STORAGE_HOST } from '@/lib/uploads/mock-storage'
import { DEMO_USER } from './demo-user'
import { communityById, communityBySlug, communitySummary } from './fixtures/communities'
import { GROUP_WIDGETS } from './fixtures/widget-seeds'
import type { MockResponse } from './types'

// A group's widgets (P-028, proposal, specs/community-widgets): in this process's memory, by
// community slug. Validates as the proposal says; only the moderators (the demo user moderates
// #trading-on-chain) save. Communities in a list come resolved, as the backend would.

/** The image a mocked widget upload answers (P-029): a fixture, nothing leaves the server. */
export const MOCK_WIDGET_IMAGE = '/mocks/chart-m2.svg'

export type StoredWidget = Stored

type Stored =
  | Exclude<RawWidget, { type: 'COMMUNITIES' }>
  | {
      id: string
      type: 'COMMUNITIES'
      title: string
      communityIds: string[]
    }

const DAY = 86_400_000
const at = (days: number, hour: number) => {
  const date = new Date(Date.now() + days * DAY)
  date.setUTCHours(hour, 0, 0, 0)
  return date.toISOString()
}

const SEEDS: Record<string, Stored[]> = {
  'trading-on-chain': [
    {
      id: 'w-toc-text',
      type: 'TEXT',
      title: 'Welcome',
      body: 'Flows of **wallets, exchanges and whales**. Share the data, not the hype.\n\n- Source every chart\n- No paid signals',
    },
    {
      id: 'w-toc-rules',
      type: 'RULES',
      title: 'Rules',
      rules: [
        {
          title: 'Data or it did not happen',
          description: 'Every claim with its on-chain source.',
        },
        { title: 'No paid signals', description: '' },
        { title: 'Be kind', description: 'Argue the data, not the person.' },
      ],
    },
    {
      id: 'w-toc-buttons',
      type: 'BUTTONS',
      title: 'Links',
      buttons: [
        { label: 'Dune dashboard', url: 'https://dune.com/trading-on-chain' },
        { label: 'DeFi', url: '/hub/defi' },
      ],
    },
    {
      id: 'w-toc-communities',
      type: 'COMMUNITIES',
      title: 'Related communities',
      communityIds: ['defi', 'BTC', 'ETH'].flatMap((slug) => communityBySlug(slug)?.id ?? []),
    },
    {
      id: 'w-toc-images',
      type: 'IMAGES',
      title: 'Charts of the week',
      images: [
        {
          imageUrl: '/mocks/chart-btc.svg',
          alt: 'BTC held by whales, last 12 weeks',
          linkUrl: null,
        },
        {
          imageUrl: '/mocks/chart-sol.svg',
          alt: 'SOL on exchanges, last 12 weeks',
          linkUrl: '/asset/SOL',
        },
      ],
    },
    {
      id: 'w-toc-calendar',
      type: 'CALENDAR',
      title: 'Events',
      events: [
        {
          title: 'Weekly flows review (live)',
          startsAt: at(2, 21),
          endsAt: at(2, 22),
          allDay: false,
          location: 'Asinko Live',
          url: null,
        },
        {
          title: 'FOMC decision',
          startsAt: at(9, 0),
          endsAt: null,
          allDay: true,
          location: null,
          url: 'https://www.federalreserve.gov',
        },
        {
          title: 'Last month recap',
          startsAt: at(-20, 20),
          endsAt: null,
          allDay: false,
          location: null,
          url: null,
        },
      ],
    },
  ],
  // The rest of the groups, as their moderators would have them (fixtures/widget-seeds.ts).
  ...GROUP_WIDGETS,
}

const WIDGETS = new Map<string, Stored[]>(Object.entries(SEEDS))
let created = 0

const error = (
  status: number,
  code: string,
  extra: Record<string, unknown> = {},
): MockResponse => ({
  status,
  body: { error: { code, message: 'mock', ...extra } },
})

/** A stored widget as the API answers it: communities resolved, the ones gone left out. */
function answer(widget: Stored): RawWidget {
  if (widget.type !== 'COMMUNITIES') return widget
  const { communityIds, ...rest } = widget
  return {
    ...rest,
    communities: communityIds.flatMap((id) => {
      const community = communityById(id)
      return community
        ? [{ ...communitySummary(community.slug), memberCount: community.memberCount }]
        : []
    }),
  }
}

/** GET /communities/{slug}/widgets */
export function listWidgets(slug: string): MockResponse {
  const community = communityBySlug(slug)
  // A group of the real backend (API_MOCKS=missing, the DEV deploy): none yet, or what its
  // moderators saved in this instance's memory.
  if (!community) return { status: 200, body: { items: (WIDGETS.get(slug) ?? []).map(answer) } }
  return { status: 200, body: { items: (WIDGETS.get(community.slug) ?? []).map(answer) } }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Who may write the widgets of a group (P-028): the demo user, a moderator of the fixtures'. For a
 * group of the real backend the mock cannot know the roles: the front already offers it only to its
 * moderators, from the backend's own data (phase 3 of the backend, 2026-10-21).
 */
function writer(slug: string, userId: unknown): MockResponse | null {
  if (!communityBySlug(slug))
    return typeof userId === 'string' && UUID.test(userId) ? null : error(403, 'USER_MISMATCH')
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  return moderates(slug) ? null : error(403, 'NOT_MODERATOR')
}

const text = (value: unknown, min: number, max: number) =>
  typeof value === 'string' && value.trim().length >= min && value.length <= max
const list = (value: unknown, max: number): value is Record<string, unknown>[] =>
  Array.isArray(value) &&
  value.length >= 1 &&
  value.length <= max &&
  value.every((each) => typeof each === 'object' && each !== null)
/** A link of a user: http(s), or a page of the site ("/hub/defi", never "//elsewhere"). */
const link = (value: unknown) => {
  if (typeof value !== 'string' || value.length > L.url) return false
  if (value.startsWith('/')) return !value.startsWith('//')
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}
const optional = (value: unknown, check: (value: unknown) => boolean) =>
  value === null || value === undefined || value === '' || check(value)
const isDate = (value: unknown) => typeof value === 'string' && !Number.isNaN(Date.parse(value))

/** The first field of a widget input that breaks P-028, or null. */
function invalidField(input: Record<string, unknown>): string | null {
  if (!WIDGET_TYPES.includes(input.type as never)) return 'type'
  if (
    !(input.type === 'IMAGES'
      ? optional(input.title, (v) => text(v, 1, L.title))
      : text(input.title, 1, L.title))
  ) {
    return 'title'
  }
  switch (input.type) {
    case 'TEXT':
      return text(input.body, 1, L.textBody) ? null : 'body'
    case 'RULES':
      return list(input.rules, L.rules) &&
        input.rules.every(
          (rule) =>
            text(rule.title, 1, L.ruleTitle) &&
            optional(rule.description, (v) => text(v, 0, L.ruleDescription)),
        )
        ? null
        : 'rules'
    case 'BUTTONS':
      return list(input.buttons, L.buttons) &&
        input.buttons.every((button) => text(button.label, 1, L.buttonLabel) && link(button.url))
        ? null
        : 'buttons'
    case 'COMMUNITIES':
      return Array.isArray(input.communityIds) &&
        input.communityIds.length >= 1 &&
        input.communityIds.length <= L.communities &&
        input.communityIds.every((id) => typeof id === 'string' && communityById(id))
        ? null
        : 'communityIds'
    case 'IMAGES':
      return list(input.images, L.images) &&
        input.images.every(
          (image) =>
            typeof image.imageUrl === 'string' &&
            text(image.alt, 1, L.imageAlt) &&
            optional(image.linkUrl, link),
        )
        ? null
        : 'images'
    case 'CALENDAR':
      return list(input.events, L.events) &&
        input.events.every(
          (event) =>
            text(event.title, 1, L.eventTitle) &&
            isDate(event.startsAt) &&
            optional(event.endsAt, isDate) &&
            typeof event.allDay === 'boolean' &&
            optional(event.location, (v) => text(v, 0, L.eventLocation)) &&
            optional(event.url, link),
        )
        ? null
        : 'events'
    default:
      return 'type'
  }
}

/** What is kept of a valid input: its fields, an id (new ones get one), empty optionals as null. */
function stored(input: Record<string, unknown>): Stored {
  const id = typeof input.id === 'string' && input.id ? input.id : `w-new-${++created}`
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const orNull = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null)
  const items = <T>(value: unknown) => value as T[]
  switch (input.type) {
    case 'TEXT':
      return { id, type: 'TEXT', title, body: String(input.body) }
    case 'RULES':
      return {
        id,
        type: 'RULES',
        title,
        rules: items<{ title: string; description?: string }>(input.rules).map((rule) => ({
          title: rule.title.trim(),
          description: rule.description?.trim() ?? '',
        })),
      }
    case 'BUTTONS':
      return {
        id,
        type: 'BUTTONS',
        title,
        buttons: items<{ label: string; url: string }>(input.buttons).map(({ label, url }) => ({
          label: label.trim(),
          url,
        })),
      }
    case 'COMMUNITIES':
      return { id, type: 'COMMUNITIES', title, communityIds: items<string>(input.communityIds) }
    case 'IMAGES':
      return {
        id,
        type: 'IMAGES',
        title,
        images: items<Record<string, unknown>>(input.images).map((image) => ({
          imageUrl: String(image.imageUrl),
          alt: String(image.alt).trim(),
          linkUrl: orNull(image.linkUrl),
        })),
      }
    default:
      return {
        id,
        type: 'CALENDAR',
        title,
        events: items<Record<string, unknown>>(input.events).map((event) => ({
          title: String(event.title).trim(),
          startsAt: new Date(String(event.startsAt)).toISOString(),
          endsAt: orNull(event.endsAt) && new Date(String(event.endsAt)).toISOString(),
          allDay: Boolean(event.allDay),
          location: orNull(event.location),
          url: orNull(event.url),
        })),
      }
  }
}

/** The demo user moderates a group (MOD label in the fixtures). */
function moderates(slug: string) {
  const membership = communityBySlug(slug)?.viewerMembership
  return membership === 'MODERATOR' || membership === 'PRINCIPAL_MODERATOR'
}

/** PUT /communities/{slug}/widgets { userId, items } */
export function saveWidgets(slug: string, body: unknown): MockResponse {
  const key = communityBySlug(slug)?.slug ?? slug
  const input = (body ?? {}) as Record<string, unknown>
  const refused = writer(key, input.userId)
  if (refused) return refused
  if (!Array.isArray(input.items)) return error(422, 'VALIDATION_ERROR')
  if (input.items.length > L.widgets) return error(422, 'TOO_MANY_WIDGETS')
  for (const [index, item] of input.items.entries()) {
    if (typeof item !== 'object' || item === null) {
      return error(422, 'INVALID_WIDGET', { index, field: 'type' })
    }
    const field = invalidField(item as Record<string, unknown>)
    if (field) return error(422, 'INVALID_WIDGET', { index, field })
  }
  WIDGETS.set(
    key,
    input.items.map((item) => stored(item as Record<string, unknown>)),
  )
  return listWidgets(key)
}

const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 5 * 1024 * 1024

/** POST /uploads/community-image (P-029): a moderator of that community, as a post image. */
export function signCommunityImageUpload(body: unknown): MockResponse {
  const input = (body ?? {}) as Record<string, unknown>
  const id = typeof input.communityId === 'string' ? input.communityId : ''
  const community = communityById(id)
  // A group of the real backend: any session's user, as saving its widgets (writer).
  if (!community && !UUID.test(id)) return error(422, 'VALIDATION_ERROR')
  const refused = community
    ? writer(community.slug, input.userId)
    : typeof input.userId === 'string' && UUID.test(input.userId)
      ? null
      : error(403, 'USER_MISMATCH')
  if (refused) return refused
  if (typeof input.contentType !== 'string' || !TYPES.has(input.contentType)) {
    return error(422, 'VALIDATION_ERROR')
  }
  if (typeof input.size !== 'number' || input.size <= 0 || input.size > MAX_BYTES) {
    return error(422, 'VALIDATION_ERROR')
  }
  const path = `${id}/mock.webp`
  return {
    status: 200,
    body: {
      uploadUrl: `https://${MOCK_STORAGE_HOST}/upload/${path}`,
      imageUrl: MOCK_WIDGET_IMAGE,
      path,
    },
  }
}
