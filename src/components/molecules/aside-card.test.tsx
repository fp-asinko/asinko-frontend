import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AsideCard } from './aside-card'

describe('AsideCard (specs/community-widgets)', () => {
  it('is a section named by its title, with its action and content', () => {
    render(
      <AsideCard id="t" title="Rules" action={<button type="button">Edit</button>}>
        <p>Be kind</p>
      </AsideCard>,
    )
    const card = screen.getByRole('region', { name: 'Rules' })
    expect(card).toHaveTextContent('Be kind')
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })
})
