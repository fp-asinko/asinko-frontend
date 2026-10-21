import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { SectionResult } from '../interests.types'
import { SidebarSection } from './sidebar-section'

function renderSection(result: SectionResult<string[]>, moreLabel?: string) {
  return renderWithIntl(
    <SidebarSection title="Assets" result={result} empty="Nothing yet" moreLabel={moreLabel}>
      {(items) => <p>{items.join(', ')}</p>}
    </SidebarSection>,
  )
}

describe('SidebarSection', () => {
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

  it('shows the empty message, and the coming-soon "more" when there are items (H-26)', () => {
    const { unmount } = renderSection({ ok: true, data: [] }, 'More assets')
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'More assets' })).toBeNull()
    unmount()

    renderSection({ ok: true, data: ['BTC'] }, 'More assets')
    expect(screen.getByRole('button', { name: 'More assets' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
