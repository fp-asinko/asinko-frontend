// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { BUTTONS, CALENDAR, COMMUNITIES, IMAGES } from '../components/widgets/widgets.fixture'
import { draftsReducer, newDraft, toDraft, toInput, type WidgetDraft } from './widget-drafts'

const titles = (drafts: WidgetDraft[]) => drafts.map((draft) => draft.title)
const named = (title: string): WidgetDraft => ({ ...newDraft('TEXT'), title })

describe('widget drafts (specs/community-widgets CW-09, CW-10)', () => {
  it('turns a saved widget into its draft and back, as P-028 takes it', () => {
    expect(toInput(toDraft(BUTTONS))).toEqual({
      id: 'w-buttons',
      type: 'BUTTONS',
      title: 'Links',
      buttons: [
        { label: 'Dune', url: 'https://dune.com/x' },
        { label: 'DeFi', url: '/hub/defi' },
      ],
    })
    expect(toInput(toDraft(COMMUNITIES))).toMatchObject({ communityIds: ['c1', 'c2'] })
    expect(toDraft(IMAGES)).toMatchObject({
      images: [{ imageUrl: '/mocks/chart-btc.svg', linkUrl: '' }, { linkUrl: '/asset/SOL' }],
    })
    expect(toDraft(CALENDAR)).toMatchObject({
      events: [{ endsAt: '2026-10-21T22:00:00.000Z', location: 'Asinko Live', url: '' }, {}, {}],
    })
  })

  it('a new widget comes with what its form needs, without an id', () => {
    expect(newDraft('RULES')).toMatchObject({ title: '', rules: [{ title: '', description: '' }] })
    expect(newDraft('IMAGES')).toMatchObject({ images: [] })
    expect(newDraft('TEXT').id).toBeUndefined()
  })

  it('adds at the end, up to 20; updates; removes', () => {
    let list = [named('A'), named('B')]
    const c = named('C')
    list = draftsReducer(list, { type: 'add', draft: c })
    expect(titles(list)).toEqual(['A', 'B', 'C'])
    list = draftsReducer(list, { type: 'update', draft: { ...c, title: 'C2' } })
    expect(titles(list)).toEqual(['A', 'B', 'C2'])
    list = draftsReducer(list, { type: 'remove', key: list[0]!.key })
    expect(titles(list)).toEqual(['B', 'C2'])
    const full = Array.from({ length: 20 }, (_, n) => named(String(n)))
    expect(draftsReducer(full, { type: 'add', draft: named('x') })).toHaveLength(20)
  })

  it('moves one to a place of the list, never out of it', () => {
    const list = [named('A'), named('B'), named('C')]
    expect(titles(draftsReducer(list, { type: 'move', key: list[2]!.key, to: 0 }))).toEqual([
      'C',
      'A',
      'B',
    ])
    expect(titles(draftsReducer(list, { type: 'move', key: list[0]!.key, to: 9 }))).toEqual([
      'B',
      'C',
      'A',
    ])
    expect(draftsReducer(list, { type: 'move', key: 'nope', to: 0 })).toBe(list)
  })
})
