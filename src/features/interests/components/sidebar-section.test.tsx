import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { SectionResult } from '../interests.types'
import { SidebarSection } from './sidebar-section'

function renderSection(result: SectionResult<string[]>, more = false, hidden: string[] = []) {
  return renderWithIntl(
    <SidebarSection title="Assets" result={result} empty="Nothing yet" more={more}>
      {(items, listId) => (
        <>
          <p>{items.join(', ')}</p>
          <ul id={listId}>
            {items.map((item) => (
              <li key={item} style={hidden.includes(item) ? { display: 'none' } : undefined}>
                {item}
              </li>
            ))}
          </ul>
        </>
      )}
    </SidebarSection>,
  )
}

describe('SidebarSection', () => {
  it('renders an optional action in the header, outside the toggle and kept when collapsed', async () => {
    renderWithIntl(
      <SidebarSection
        title="Assets"
        result={{ ok: true, data: ['BTC'] }}
        action={<button type="button">Do it</button>}
      >
        {(items) => <p>{items.join(', ')}</p>}
      </SidebarSection>,
    )
    const toggle = screen.getByRole('button', { name: /Assets/ })
    const action = screen.getByRole('button', { name: 'Do it' })
    expect(toggle).not.toContainElement(action)
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Do it' })).toBeInTheDocument()
  })

  it('puts the action right after the title and before the chevron, in tab order', async () => {
    renderWithIntl(
      <SidebarSection
        title="Assets"
        result={{ ok: true, data: ['BTC'] }}
        action={<button type="button">Do it</button>}
      >
        {(items) => <p>{items.join(', ')}</p>}
      </SidebarSection>,
    )
    const toggle = screen.getByRole('button', { name: 'Assets' })
    const action = screen.getByRole('button', { name: 'Do it' })
    expect(toggle).not.toContainElement(action)
    const title = screen.getByText('Assets', { selector: 'span[aria-hidden]' })
    const chevron = toggle.closest('div')!.querySelector('svg')!
    const after = Node.DOCUMENT_POSITION_FOLLOWING
    expect(title.compareDocumentPosition(action) & after).toBeTruthy()
    expect(action.compareDocumentPosition(chevron) & after).toBeTruthy()

    // Trigger first, then the action.
    await userEvent.tab()
    expect(toggle).toHaveFocus()
    await userEvent.tab()
    expect(action).toHaveFocus()
  })

  it('clicking the action does not toggle the section; the toggle still does with the keyboard', async () => {
    renderWithIntl(
      <SidebarSection
        title="Assets"
        result={{ ok: true, data: ['BTC'] }}
        action={<button type="button">Do it</button>}
      >
        {(items) => <p>{items.join(', ')}</p>}
      </SidebarSection>,
    )
    const toggle = screen.getByRole('button', { name: 'Assets' })
    await userEvent.click(screen.getByRole('button', { name: 'Do it' }))
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    toggle.focus()
    await userEvent.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('without an action renders a single button named by the title', () => {
    renderSection({ ok: true, data: ['BTC'] })
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Assets' })).toBeInTheDocument()
  })

  it('is a named region with a heading outside the toggle', () => {
    renderSection({ ok: true, data: ['BTC'] })
    const region = screen.getByRole('region', { name: 'Assets' })
    const heading = screen.getByRole('heading', { name: 'Assets', level: 2 })
    expect(region).toContainElement(heading)
    expect(heading.closest('button')).toBeNull()
  })

  it('starts open and collapses from its toggle, announcing the state (S-01)', async () => {
    renderSection({ ok: true, data: ['BTC', 'ETH'] })
    const toggle = screen.getByRole('button', { name: 'Assets' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('BTC, ETH')).toBeVisible()

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    // Closed, the panel leaves the page once its height animation ends.
    await waitFor(() => expect(screen.queryByText('BTC, ETH')).toBeNull())

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('BTC, ETH')).toBeVisible()
  })

  it('filling the column, it still opens and closes (specs/sidebar-fill SF-02)', async () => {
    renderWithIntl(
      <SidebarSection title="Suggested" result={{ ok: true, data: ['A'] }} fill>
        {(items) => <p>{items.join(', ')}</p>}
      </SidebarSection>,
    )
    const toggle = screen.getByRole('button', { name: 'Suggested' })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(screen.queryByText('A')).toBeNull())
    await userEvent.click(toggle)
    expect(await screen.findByText('A')).toBeVisible()
  })

  it('shows its own error without breaking the column (H-19)', () => {
    renderSection({ ok: false })
    expect(screen.getByText('Could not load this section.')).toBeInTheDocument()
  })

  it('shows the empty message, and "more" only while its list hides something (specs/sidebar-more)', async () => {
    const { unmount } = renderSection({ ok: true, data: [] }, true)
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /more/ })).toBeNull()
    unmount()

    const all = renderSection({ ok: true, data: ['BTC', 'ETH'] }, true)
    expect(screen.queryByRole('button', { name: /more/ })).toBeNull()
    all.unmount()

    renderSection({ ok: true, data: ['BTC', 'ETH'] }, true, ['ETH'])
    const more = await screen.findByRole('button', { name: 'more: Assets' })
    expect(more).toHaveAttribute('aria-controls', screen.getByRole('list').id)
  })
})
