import { WIDGET_LIMITS, type WidgetType } from '@/lib/api/contract/widgets'
import type { CommunityWidget } from '../communities.types'

// The list "Edit widgets" changes before Save (specs/community-widgets CW-08 to CW-12): a local
// draft of every widget, in order. Pure: the dialog keeps it in a reducer, the tests drive it.

/** A community chosen in a "Communities" widget: its id goes, the rest is for its row. */
export type DraftCommunity = { id: string; handle: string; slug: string; avatarUrl: string | null }

type Fields =
  | { type: 'TEXT'; body: string }
  | { type: 'RULES'; rules: { title: string; description: string }[] }
  | { type: 'BUTTONS'; buttons: { label: string; url: string }[] }
  | { type: 'COMMUNITIES'; communities: DraftCommunity[] }
  | { type: 'IMAGES'; images: { imageUrl: string; alt: string; linkUrl: string }[] }
  | {
      type: 'CALENDAR'
      events: {
        title: string
        startsAt: string
        endsAt: string
        allDay: boolean
        location: string
        url: string
      }[]
    }

/** A widget being edited: `key` names it in the list, `id` is the backend's (none when new). */
export type WidgetDraft = { key: string; id?: string; title: string } & Fields

let keys = 0
const nextKey = () => `draft-${++keys}`

/** A saved widget as its draft: links and images as their texts again. */
export function toDraft(widget: CommunityWidget): WidgetDraft {
  const base = { key: nextKey(), id: widget.id, title: widget.title }
  switch (widget.type) {
    case 'TEXT':
      return { ...base, type: 'TEXT', body: widget.body }
    case 'RULES':
      return { ...base, type: 'RULES', rules: widget.rules.map((rule) => ({ ...rule })) }
    case 'BUTTONS':
      return {
        ...base,
        type: 'BUTTONS',
        buttons: widget.buttons.map(({ label, link }) => ({ label, url: link.url })),
      }
    case 'COMMUNITIES':
      return {
        ...base,
        type: 'COMMUNITIES',
        communities: widget.communities.map(({ id, handle, slug, avatarUrl }) => ({
          id,
          handle,
          slug,
          avatarUrl,
        })),
      }
    case 'IMAGES':
      return {
        ...base,
        type: 'IMAGES',
        images: widget.images.map(({ src, alt, link }) => ({
          imageUrl: src,
          alt,
          linkUrl: link?.url ?? '',
        })),
      }
    case 'CALENDAR':
      return {
        ...base,
        type: 'CALENDAR',
        events: widget.events.map(({ link, endsAt, location, ...event }) => ({
          ...event,
          endsAt: endsAt ?? '',
          location: location ?? '',
          url: link?.url ?? '',
        })),
      }
  }
}

/** A new, empty widget of a type (CW-10): its form asks for the rest. */
export function newDraft(type: WidgetType): WidgetDraft {
  const base = { key: nextKey(), title: '' }
  switch (type) {
    case 'TEXT':
      return { ...base, type, body: '' }
    case 'RULES':
      return { ...base, type, rules: [{ title: '', description: '' }] }
    case 'BUTTONS':
      return { ...base, type, buttons: [{ label: '', url: '' }] }
    case 'COMMUNITIES':
      return { ...base, type, communities: [] }
    case 'IMAGES':
      return { ...base, type, images: [] }
    case 'CALENDAR':
      return {
        ...base,
        type,
        events: [{ title: '', startsAt: '', endsAt: '', allDay: false, location: '', url: '' }],
      }
  }
}

/** A draft as P-028's PUT takes it: a community by its id. */
export function toInput(draft: WidgetDraft): Record<string, unknown> & { type: WidgetType } {
  const { key: _key, ...rest } = draft
  if (rest.type === 'COMMUNITIES') {
    const { communities, ...widget } = rest
    return { ...widget, communityIds: communities.map((community) => community.id) }
  }
  return rest
}

export type DraftsAction =
  | { type: 'add'; draft: WidgetDraft }
  | { type: 'update'; draft: WidgetDraft }
  | { type: 'remove'; key: string }
  | { type: 'move'; key: string; to: number }

/** The list's changes (CW-09, CW-10): a new one at the end, up to 20; a move within the list. */
export function draftsReducer(drafts: WidgetDraft[], action: DraftsAction): WidgetDraft[] {
  switch (action.type) {
    case 'add':
      return drafts.length >= WIDGET_LIMITS.widgets ? drafts : [...drafts, action.draft]
    case 'update':
      return drafts.map((draft) => (draft.key === action.draft.key ? action.draft : draft))
    case 'remove':
      return drafts.filter((draft) => draft.key !== action.key)
    case 'move': {
      const from = drafts.findIndex((draft) => draft.key === action.key)
      const to = Math.max(0, Math.min(drafts.length - 1, action.to))
      if (from === -1 || from === to) return drafts
      const next = [...drafts]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved!)
      return next
    }
  }
}
