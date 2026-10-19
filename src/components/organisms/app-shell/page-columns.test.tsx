import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageColumns, PageHero } from './page-columns'

describe('PageColumns', () => {
  it('renders the center column content', () => {
    render(<PageColumns>center</PageColumns>)
    expect(screen.getByText('center')).toBeInTheDocument()
  })
})

describe('PageHero (specs/community-widgets CW-01)', () => {
  it('marks the hero for the shell, which puts it over both columns from lg', () => {
    render(
      <>
        <PageHero>
          <h1>#macro</h1>
        </PageHero>
        <PageColumns>
          <p>Feed</p>
        </PageColumns>
      </>,
    )
    const hero = screen.getByRole('heading', { name: '#macro' }).parentElement!
    expect(hero).toHaveAttribute('data-hero')
    // The center column goes under it: the second row of the grid.
    expect(screen.getByText('Feed').parentElement).toHaveClass('lg:row-start-2')
  })
})
