import { screen } from '@testing-library/react'
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
    expect(heading.closest('summary')).toBeNull()
  })

  it('is a native <details>, open by default, that collapses without JavaScript', async () => {
    renderSection({ ok: true, data: ['BTC', 'ETH'] })
    const details = screen.getByRole('region', { name: 'Assets' }).querySelector('details')!
    expect(details).toHaveAttribute('open')
    expect(screen.getByText('BTC, ETH')).toBeInTheDocument()

    await userEvent.click(details.querySelector('summary')!)
    expect(details).not.toHaveAttribute('open')
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
