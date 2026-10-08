import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { THESES } from '@/mocks/fixtures/theses'
import { renderWithIntl } from '@/test/render-with-intl'
import { toThesisItem } from '../lib/theses-api'
import { ThesisListItems } from './thesis-list-items'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
// The mapper is server-only; its own module stub keeps it loadable here.
vi.mock('@/lib/api', () => ({}))

describe('ThesisListItems (specs/profile-track-record PT-05)', () => {
  it('renders one list item with its card per thesis, named by its claim', () => {
    const theses = THESES.slice(0, 3).map(toThesisItem)
    renderWithIntl(
      <ul>
        <ThesisListItems theses={theses} />
      </ul>,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    for (const thesis of theses) {
      expect(screen.getByRole('article', { name: thesis.claim })).toBeInTheDocument()
    }
  })
})
