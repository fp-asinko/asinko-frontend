import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { RightColumn } from './right-column'

describe('RightColumn (RC-01)', () => {
  it('shows the season tokens first and the footer after them', () => {
    renderWithIntl(<RightColumn />)
    const tokens = screen.getByRole('region', { name: 'Season tokens' })
    const rules = screen.getByRole('button', { name: 'Rules' })
    expect(tokens.compareDocumentPosition(rules) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('no longer invites to join: that moved to the left column (specs/guest-sidebar GS-05)', () => {
    renderWithIntl(<RightColumn />)
    expect(screen.queryByRole('region', { name: 'New to Asinko?' })).toBeNull()
  })
})
