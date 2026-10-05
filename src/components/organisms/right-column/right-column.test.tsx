import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { RightColumn } from './right-column'

describe('RightColumn (RC-01)', () => {
  it('shows the season tokens first and the footer after them', () => {
    renderWithIntl(<RightColumn signedIn />)
    const tokens = screen.getByRole('region', { name: 'Season tokens' })
    const rules = screen.getByRole('button', { name: 'Rules' })
    expect(tokens.compareDocumentPosition(rules) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('invites to join above the tokens only without a session (G-03)', () => {
    const { unmount } = renderWithIntl(<RightColumn signedIn />)
    expect(screen.queryByRole('region', { name: 'New to Asinko?' })).toBeNull()
    unmount()

    renderWithIntl(<RightColumn signedIn={false} />)
    const join = screen.getByRole('region', { name: 'New to Asinko?' })
    expect(join).toHaveTextContent('Every call you make is checked against the market.')
    const tokens = screen.getByRole('region', { name: 'Season tokens' })
    expect(join.compareDocumentPosition(tokens) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })
})
