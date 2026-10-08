import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThesesListSkeleton } from './theses-list-skeleton'

describe('ThesesListSkeleton (specs/profile-track-record PT-06)', () => {
  it('announces the loading and hides its shapes from screen readers', () => {
    renderWithIntl(<ThesesListSkeleton />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
    expect(screen.getByTestId('theses-skeleton')).toHaveAttribute('aria-hidden', 'true')
  })
})
