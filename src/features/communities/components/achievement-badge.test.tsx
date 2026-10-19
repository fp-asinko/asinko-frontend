import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AchievementBadge, AchievementProgress } from './achievement-badge'

describe('AchievementBadge (specs/profile-achievements AC-01, AC-09)', () => {
  it('is decoration: its name says what it is, in words', () => {
    const { container } = renderWithIntl(<AchievementBadge code="STREAK_3" earned />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('AchievementProgress (AC-07)', () => {
  it('says how far it is, accuracy in points', () => {
    renderWithIntl(<AchievementProgress code="STREAK_5" progress={{ current: 3, target: 5 }} />)
    expect(screen.getByRole('progressbar', { name: 'Progress' })).toHaveAttribute(
      'aria-valuetext',
      '3 of 5',
    )
  })

  it('accuracy in percent, and never past its end', () => {
    renderWithIntl(
      <AchievementProgress code="ACCURACY_70" progress={{ current: 72, target: 70 }} />,
    )
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuetext', '72% of 70%')
    expect(bar).toHaveAttribute('aria-valuenow', '70')
  })
})
