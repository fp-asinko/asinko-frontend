'use server'

import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import type { CommunityWidget } from '../communities.types'
import { saveWidgetsAs, type WidgetInput } from '../lib/widgets-api'
import { saveWidgetsSchema, type WidgetInputData } from '../schemas/widget.schema'

/** A widget as P-028 takes it: what was left empty goes as null. */
function toPut(widget: WidgetInputData): WidgetInput {
  const orNull = (value: string) => value || null
  switch (widget.type) {
    case 'IMAGES':
      return {
        ...widget,
        images: widget.images.map((image) => ({ ...image, linkUrl: orNull(image.linkUrl) })),
      }
    case 'CALENDAR':
      return {
        ...widget,
        events: widget.events.map((event) => ({
          ...event,
          startsAt: new Date(event.startsAt).toISOString(),
          endsAt: event.endsAt ? new Date(event.endsAt).toISOString() : null,
          location: orNull(event.location),
          url: orNull(event.url),
        })),
      }
    default:
      return widget
  }
}

/** The field P-028 names in INVALID_WIDGET, as the editor's message. */
const FIELD_ERRORS: Record<string, string> = {
  title: 'communities.widgets.errors.titleRequired',
  body: 'communities.widgets.errors.bodyRequired',
  rules: 'communities.widgets.errors.invalidRules',
  buttons: 'communities.widgets.errors.invalidButtons',
  communityIds: 'communities.widgets.errors.invalidCommunities',
  images: 'communities.widgets.errors.invalidImages',
  events: 'communities.widgets.errors.invalidEvents',
}

/**
 * Saves a group's widgets, the whole list in its order (specs/community-widgets CW-12). A public
 * endpoint: checks its input with the forms' schemas and the session itself, and takes the userId
 * from it; whether the viewer moderates the group, the backend decides (CW-13). A widget the
 * backend refuses is said by its position (`fieldErrors` keyed by it), so the list marks it.
 */
export async function saveWidgets(raw: unknown): Promise<ActionResult<CommunityWidget[]>> {
  const parsed = saveWidgetsSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const [where, index] = issue.path
      if (where === 'items' && typeof index === 'number') {
        fieldErrors[String(index)] ??= [issue.message]
      }
    }
    return { ok: false, error: 'communities.widgets.errors.invalid', fieldErrors }
  }
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const { slug, items } = parsed.data
  const result = await saveWidgetsAs(viewer.id, slug, items.map(toPut))
  if (result.ok) return result
  if (result.code === 'NOT_MODERATOR') {
    return { ok: false, error: 'communities.widgets.errors.notModerator' }
  }
  if (result.code === 'TOO_MANY_WIDGETS') {
    return { ok: false, error: 'communities.widgets.errors.tooManyWidgets' }
  }
  if (result.code === 'INVALID_WIDGET' && typeof result.index === 'number') {
    const message = FIELD_ERRORS[result.field ?? ''] ?? 'communities.widgets.errors.invalid'
    return {
      ok: false,
      error: 'communities.widgets.errors.invalid',
      fieldErrors: { [String(result.index)]: [message] },
    }
  }
  return { ok: false, error: result.errorKey }
}
