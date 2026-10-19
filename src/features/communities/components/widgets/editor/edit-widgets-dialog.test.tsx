import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { BUTTONS, TEXT } from '../widgets.fixture'
import { EditWidgetsDialog } from './edit-widgets-dialog'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
const actions = vi.hoisted(() => ({ saveWidgets: vi.fn() }))
vi.mock('../../../actions/save-widgets.action', () => ({ saveWidgets: actions.saveWidgets }))
vi.mock('../../../actions/find-widget-communities.action', () => ({
  findWidgetCommunities: vi.fn(),
}))
vi.mock('../../../actions/upload-widget-image.action', () => ({ uploadWidgetImage: vi.fn() }))

function renderDialog() {
  const onOpenChange = vi.fn()
  const onSaved = vi.fn()
  renderWithIntl(
    <EditWidgetsDialog
      layout="modal"
      open
      onOpenChange={onOpenChange}
      slug="trading-on-chain"
      communityId="00000000-0000-4000-8000-000000001009"
      widgets={[TEXT, BUTTONS]}
      onSaved={onSaved}
    />,
  )
  return { onOpenChange, onSaved }
}

const dialog = () => screen.getByRole('dialog')
const button = (name: string) => within(dialog()).getByRole('button', { name })
const rows = () => within(dialog()).getAllByRole('listitem').slice(1)

describe('EditWidgetsDialog (specs/community-widgets CW-08 to CW-12)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    actions.saveWidgets.mockResolvedValue({ ok: true, data: [] })
  })

  it('adds a text widget at the end and saves the whole list', async () => {
    const { onOpenChange, onSaved } = renderDialog()
    expect(within(dialog()).getByText('Widgets: 2/20')).toBeInTheDocument()
    await userEvent.click(button('Add widget'))
    await userEvent.click(await screen.findByRole('menuitem', { name: /^Text/ }))

    await userEvent.type(within(dialog()).getByRole('textbox', { name: 'Title' }), 'Hello')
    await userEvent.type(within(dialog()).getByRole('textbox', { name: 'Text' }), 'Be kind.')
    await userEvent.click(button('Done'))
    expect(rows()).toHaveLength(3)
    expect(rows()[2]).toHaveTextContent('Hello')

    await userEvent.click(button('Save'))
    expect(actions.saveWidgets).toHaveBeenCalledWith({
      slug: 'trading-on-chain',
      items: [
        expect.objectContaining({ id: 'w-text', type: 'TEXT' }),
        expect.objectContaining({ id: 'w-buttons', type: 'BUTTONS' }),
        { type: 'TEXT', title: 'Hello', body: 'Be kind.' },
      ],
    })
    expect(onSaved).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(router.refresh).toHaveBeenCalled()
  })

  it('says what a form misses, and Back from a new widget drops it', async () => {
    renderDialog()
    await userEvent.click(button('Add widget'))
    await userEvent.click(await screen.findByRole('menuitem', { name: /^Text/ }))
    await userEvent.click(button('Done'))
    expect(within(dialog()).getByText('Write a title')).toBeInTheDocument()
    await userEvent.click(button('Back'))
    expect(rows()).toHaveLength(2)
  })

  it('edits one in its form, and deletes it after asking', async () => {
    renderDialog()
    await userEvent.click(button('Edit Welcome'))
    const title = within(dialog()).getByRole('textbox', { name: 'Title' })
    await userEvent.clear(title)
    await userEvent.type(title, 'Hi there')
    await userEvent.click(button('Done'))
    expect(rows()[0]).toHaveTextContent('Hi there')

    await userEvent.click(button('Edit Hi there'))
    await userEvent.click(button('Delete widget'))
    const ask = await screen.findByRole('alertdialog', { name: 'Delete this widget?' })
    await userEvent.click(within(ask).getByRole('button', { name: 'Delete' }))
    expect(rows()).toHaveLength(1)
  })

  it('asks before closing with changes, and closes at once without them', async () => {
    const { onOpenChange } = renderDialog()
    await userEvent.click(button('Cancel'))
    expect(onOpenChange).toHaveBeenCalledWith(false)

    onOpenChange.mockClear()
    await userEvent.click(button('Move Welcome down'))
    await userEvent.click(button('Cancel'))
    expect(await screen.findByRole('alertdialog', { name: 'Discard changes?' })).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('marks the widget the server refused, keeping the list', async () => {
    actions.saveWidgets.mockResolvedValue({
      ok: false,
      error: 'communities.widgets.errors.invalid',
      fieldErrors: { '1': ['communities.widgets.errors.invalidButtons'] },
    })
    const { onOpenChange } = renderDialog()
    await userEvent.click(button('Save'))
    expect(await within(dialog()).findByRole('alert')).toHaveTextContent(
      'A widget has something to fix: it is marked.',
    )
    expect(rows()[1]).toHaveTextContent('Check its buttons')
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
