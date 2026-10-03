import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { identityIndex } from '@/lib/identity-color'
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

  it('renders the image when there is one, without an identity color', () => {
    const { container } = render(<UserAvatar name="maria" imageUrl="/mocks/chart-btc.svg" />)
    expect(container.querySelector('img')).toBeInTheDocument()
    expect(screen.getByTestId('user-avatar')).not.toHaveAttribute('data-color')
  })

  it('gives the same handle the same identity color everywhere (FC-01)', () => {
    render(
      <>
        <UserAvatar name="quantsimula" size="xs" />
        <UserAvatar name="@QuantSimula" size="xl" />
      </>,
    )
    const [small, large] = screen.getAllByTestId('user-avatar')
    const expected = String(identityIndex('quantsimula'))
    expect(small).toHaveAttribute('data-color', expected)
    expect(large).toHaveAttribute('data-color', expected)
  })

  it('stays neutral for a placeholder that is nobody yet', () => {
    render(<UserAvatar name="?" tone="neutral" />)
    expect(screen.getByTestId('user-avatar')).not.toHaveAttribute('data-color')
  })

  it('keys the color on colorKey when the visible name is a display name', () => {
    render(<UserAvatar name="On-chain" colorKey="onchain" />)
    expect(screen.getByTestId('user-avatar')).toHaveAttribute(
      'data-color',
      String(identityIndex('onchain')),
    )
  })
})
