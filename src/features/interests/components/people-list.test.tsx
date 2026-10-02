import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { PeopleList } from './people-list'

describe('PeopleList (H-07)', () => {
  it('shows each person as @handle with the accuracy, without a link (Q4)', () => {
    renderWithIntl(
      <PeopleList
        people={[
          { handle: '@maria', id: '1', username: 'maria', avatarUrl: null, accuracyRate: 0.74 },
          { handle: '@ana', id: '2', username: 'ana', avatarUrl: null, accuracyRate: null },
        ]}
      />,
    )
    expect(screen.getByText('@maria')).toBeInTheDocument()
    expect(screen.getByText('@ana')).toBeInTheDocument()
    expect(screen.getByText('74% accuracy')).toBeInTheDocument()
    expect(screen.getAllByText(/accuracy/)).toHaveLength(1)
    expect(screen.queryByRole('link')).toBeNull()
  })
})
