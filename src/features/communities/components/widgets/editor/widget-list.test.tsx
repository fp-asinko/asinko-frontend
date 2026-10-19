import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useReducer } from 'react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { draftsReducer, newDraft, type WidgetDraft } from '../../../lib/widget-drafts'
import { WidgetList } from './widget-list'

const named = (title: string): WidgetDraft => ({ ...newDraft('TEXT'), title })

function List({ errors = {} }: { errors?: Record<string, string> }) {
  const [drafts, dispatch] = useReducer(draftsReducer, [named('A'), named('B'), named('C')])
  return (
    <>
      <WidgetList
        drafts={drafts}
        errors={errors}
        onEdit={() => {}}
        onMove={(key, to) => dispatch({ type: 'move', key, to })}
      />
      <p data-testid="order">{drafts.map((draft) => draft.title).join('')}</p>
    </>
  )
}

const order = () => screen.getByTestId('order').textContent

describe('WidgetList (specs/community-widgets CW-08, CW-09)', () => {
  it('pins Community details first, then each widget with its type', () => {
    renderWithIntl(<List />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Community details')
    expect(items[1]).toHaveTextContent('A Text')
    expect(screen.getByRole('button', { name: 'Edit A' })).toBeInTheDocument()
  })

  it('moves with the arrows, keeping the focus and saying where it went', async () => {
    renderWithIntl(<List />)
    const down = screen.getByRole('button', { name: 'Move A down' })
    await userEvent.click(down)
    expect(order()).toBe('BAC')
    expect(screen.getByRole('status')).toHaveTextContent('A, position 2 of 3')
    expect(down).toHaveFocus()
    // At an end the arrow is there, marked unavailable, and does nothing.
    const up = screen.getByRole('button', { name: 'Move B up' })
    expect(up).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(up)
    expect(order()).toBe('BAC')
  })

  it('moves with the arrow keys on the handle too', async () => {
    renderWithIntl(<List />)
    screen.getByRole('button', { name: 'Drag C to reorder' }).focus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(order()).toBe('CAB')
  })

  it('moves by dragging the handle over another row', () => {
    renderWithIntl(<List />)
    const rows = screen.getAllByRole('listitem').slice(1)
    rows.forEach((row, index) => {
      row.getBoundingClientRect = () => ({ top: index * 60, height: 56 }) as DOMRect
    })
    const handle = screen.getByRole('button', { name: 'Drag A to reorder' })
    handle.setPointerCapture = () => {}
    fireEvent.pointerDown(handle, { button: 0, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientY: 150, pointerId: 1 })
    fireEvent.pointerUp(handle, { pointerId: 1 })
    expect(order()).toBe('BCA')
  })

  it('marks a widget the server refused, saying why', () => {
    const drafts = [named('A'), named('B')]
    renderWithIntl(
      <WidgetList
        drafts={drafts}
        errors={{ [drafts[1]!.key]: 'Check its buttons' }}
        onEdit={() => {}}
        onMove={() => {}}
      />,
    )
    expect(screen.getAllByRole('listitem')[2]).toHaveTextContent('Check its buttons')
  })
})
