// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { saveWidgetsSchema, widgetInputSchema } from './widget.schema'

const issue = (input: unknown) => widgetInputSchema.safeParse(input).error?.issues[0]?.message

describe('widget schemas (specs/community-widgets CW-06, CW-07, P-028)', () => {
  it('takes each type within its limits', () => {
    for (const widget of [
      { type: 'TEXT', title: 'Hi', body: 'Hello' },
      { type: 'RULES', title: 'R', rules: [{ title: 'Be kind', description: '' }] },
      { type: 'BUTTONS', title: 'L', buttons: [{ label: 'DeFi', url: '/hub/defi' }] },
      { type: 'COMMUNITIES', title: 'C', communityIds: ['00000000-0000-4000-8000-000000001001'] },
      { type: 'IMAGES', title: '', images: [{ imageUrl: '/a.webp', alt: 'A chart', linkUrl: '' }] },
      {
        type: 'CALENDAR',
        title: 'E',
        events: [
          {
            title: 'FOMC',
            startsAt: '2026-10-28T00:00:00.000Z',
            endsAt: '',
            allDay: true,
            location: '',
            url: '',
          },
        ],
      },
    ]) {
      expect(widgetInputSchema.safeParse(widget).success).toBe(true)
    }
  })

  it('says what is missing or wrong, as a key', () => {
    expect(issue({ type: 'TEXT', title: ' ', body: 'x' })).toBe(
      'communities.widgets.errors.titleRequired',
    )
    expect(issue({ type: 'TEXT', title: 'x', body: 'x'.repeat(5001) })).toBe(
      'communities.widgets.errors.tooLong',
    )
    expect(
      issue({ type: 'BUTTONS', title: 'L', buttons: [{ label: 'x', url: 'javascript:1' }] }),
    ).toBe('communities.widgets.errors.link')
    expect(issue({ type: 'RULES', title: 'R', rules: [] })).toBe(
      'communities.widgets.errors.atLeastOne',
    )
    expect(
      issue({
        type: 'COMMUNITIES',
        title: 'C',
        communityIds: Array(2).fill('00000000-0000-4000-8000-000000001001'),
      }),
    ).toBe('communities.widgets.errors.repeated')
  })

  it('an event does not end before it starts', () => {
    const event = {
      title: 'x',
      startsAt: '2026-10-21T21:00:00.000Z',
      endsAt: '2026-10-21T20:00:00.000Z',
      allDay: false,
      location: '',
      url: '',
    }
    expect(issue({ type: 'CALENDAR', title: 'E', events: [event] })).toBe(
      'communities.widgets.errors.endBeforeStart',
    )
  })

  it('a list of up to 20', () => {
    const items = Array.from({ length: 21 }, () => ({ type: 'TEXT', title: 'x', body: 'x' }))
    expect(saveWidgetsSchema.safeParse({ slug: 'macro', items }).success).toBe(false)
  })
})
