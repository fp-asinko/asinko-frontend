import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { RightColumn } from './right-column'

describe('RightColumn (RC-01, specs/community-widgets CW-02)', () => {
  it('shows what the page brings, and the footer after it', () => {
    renderWithIntl(
      <RightColumn>
        <section aria-label="Lead" />
      </RightColumn>,
    )
    const lead = screen.getByRole('region', { name: 'Lead' })
    const rules = screen.getByRole('button', { name: 'Rules' })
    expect(lead.compareDocumentPosition(rules) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('brings neither the season tokens nor an invitation by itself: only the footer', () => {
    renderWithIntl(<RightColumn />)
    expect(screen.queryByRole('region', { name: 'Season tokens' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'New to Asinko?' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Rules' })).toBeInTheDocument()
  })
})
