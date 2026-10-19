import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ProfileAbout } from './profile-about'

describe('ProfileAbout (specs/profile-showcase PS-04)', () => {
  it('shows a short one whole, without See more', () => {
    renderWithIntl(<ProfileAbout text="Macro and rates." />)
    expect(screen.getByText('Macro and rates.')).toBeInTheDocument()
    expect(screen.queryByText('See more')).toBeNull()
  })

  it('clamps a long one, and See more opens it', async () => {
    const text = `How I invest.\n${'Position sizing by volatility. '.repeat(10)}`
    renderWithIntl(<ProfileAbout text={text} />)
    const details = screen.getByText('See more').closest('details')!
    expect(details).not.toHaveAttribute('open')

    // jsdom does not toggle a summary from the keyboard; browsers do (e2e).
    await userEvent.click(screen.getByText('See more'))
    expect(details).toHaveAttribute('open')
  })

  it('clamps one of many short lines too', () => {
    renderWithIntl(<ProfileAbout text={'One\nTwo\nThree\nFour'} />)
    expect(screen.getByText('See more')).toBeInTheDocument()
  })
})
