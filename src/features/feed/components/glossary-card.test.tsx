import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { GlossaryItem } from '../feed.types'
import { GlossaryCard } from './glossary-card'

const TERM: GlossaryItem = {
  kind: 'glossary',
  id: '00000000-0000-4000-8000-00000000c001',
  term: 'Short selling',
  category: 'Trading',
  definition: "Selling an asset you don't own, borrowed from a broker.",
  example: 'A trader borrows 100 shares and sells them at $50.',
}

describe('GlossaryCard', () => {
  it('says it is a glossary term, with the term as a heading and its example (GL-02, GL-04)', () => {
    renderWithIntl(<GlossaryCard term={TERM} />)
    expect(screen.getByRole('article', { name: 'Glossary: Short selling' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Short selling' })).toBeInTheDocument()
    // No group above the term (PO, 2026-10-26).
    expect(screen.queryByText('Trading')).toBeNull()
    expect(screen.getByText('Glossary')).toBeInTheDocument()
    expect(screen.getByText(TERM.definition)).toBeInTheDocument()
    expect(screen.getByText('Example')).toBeInTheDocument()
    expect(screen.getByText(TERM.example!)).toBeInTheDocument()
  })

  it('has no votes, comments nor link: the platform own content (GL-02)', () => {
    renderWithIntl(<GlossaryCard term={TERM} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('leaves the box out without an example', () => {
    renderWithIntl(<GlossaryCard term={{ ...TERM, example: null }} />)
    expect(screen.queryByText('Example')).toBeNull()
  })
})
