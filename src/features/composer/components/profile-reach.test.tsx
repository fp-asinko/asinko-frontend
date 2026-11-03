import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ProfileReach } from './profile-reach'

describe('ProfileReach (specs/submit-form-layout SF-13)', () => {
  it('says a group post also shows on the profile', () => {
    renderWithIntl(<ProfileReach id="reach" own={false} />)
    expect(screen.getByText('Also on your profile')).toHaveAttribute('id', 'reach')
  })

  it('says a post in the own channel shows only there', () => {
    renderWithIntl(<ProfileReach id="reach" own />)
    expect(screen.getByText('Only on your profile')).toBeVisible()
  })
})
