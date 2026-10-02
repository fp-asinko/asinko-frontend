import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UserAvatar } from './user-avatar'

describe('UserAvatar', () => {
  it('shows the initials when there is no image, hidden from screen readers', () => {
    render(<UserAvatar name="maria" />)
    const avatar = screen.getByTestId('user-avatar')
    expect(avatar).toHaveTextContent('MA')
    expect(avatar).toHaveAttribute('aria-hidden')
  })

  it('ignores the mention prefix in the initials', () => {
    render(<UserAvatar name="#defi" />)
    expect(screen.getByTestId('user-avatar')).toHaveTextContent('DE')
  })

  it('renders the image when there is one', () => {
    const { container } = render(<UserAvatar name="maria" imageUrl="/mocks/chart-btc.svg" />)
    expect(container.querySelector('img')).toBeInTheDocument()
  })
})
