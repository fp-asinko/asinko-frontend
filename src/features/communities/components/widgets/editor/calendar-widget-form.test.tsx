import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { toDraft } from '../../../lib/widget-drafts'
import { CALENDAR } from '../widgets.fixture'
import { CalendarWidgetForm, fromFieldValue, toFieldValue } from './calendar-widget-form'

const actions = vi.hoisted(() => ({
  findWidgetCommunities: vi.fn(),
  uploadWidgetImage: vi.fn(),
  prepareImage: vi.fn(),
}))
vi.mock('../../../actions/find-widget-communities.action', () => ({
  findWidgetCommunities: actions.findWidgetCommunities,
}))
vi.mock('../../../actions/upload-widget-image.action', () => ({
  uploadWidgetImage: actions.uploadWidgetImage,
}))
vi.mock('@/lib/prepare-image', async (original) => ({
  ...(await original<typeof import('@/lib/prepare-image')>()),
  prepareImage: actions.prepareImage,
}))

/** Each form is submitted by the dialog's "Done" (form attribute): a button here. */
function withDone(form: React.ReactElement) {
  return (
    <>
      {form}
      <button type="submit" form="form">
        Done
      </button>
    </>
  )
}
const done = () => userEvent.click(screen.getByRole('button', { name: 'Done' }))

beforeEach(() => vi.clearAllMocks())

describe('CalendarWidgetForm (CW-06, CW-10)', () => {
  it('keeps the times of an event as instants, an all-day one as its date', async () => {
    const onDone = vi.fn()
    renderWithIntl(
      withDone(
        <CalendarWidgetForm draft={toDraft(CALENDAR) as never} formId="form" onDone={onDone} />,
      ),
    )
    await done()
    const [event, allDay] = onDone.mock.calls[0]![0].events
    expect(event).toMatchObject({
      startsAt: '2026-10-21T21:00:00.000Z',
      endsAt: '2026-10-21T22:00:00.000Z',
    })
    expect(allDay).toMatchObject({ allDay: true, startsAt: '2026-10-28T00:00:00.000Z', endsAt: '' })
  })

  it('converts between a field and an instant', () => {
    expect(toFieldValue('2026-10-28T00:00:00.000Z', true)).toBe('2026-10-28')
    expect(fromFieldValue('2026-10-28', true)).toBe('2026-10-28T00:00:00.000Z')
    const local = toFieldValue('2026-10-21T21:00:00.000Z', false)
    expect(fromFieldValue(local, false)).toBe('2026-10-21T21:00:00.000Z')
    expect(toFieldValue('', false)).toBe('')
  })
})
