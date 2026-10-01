import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageColumns } from './page-columns'

describe('PageColumns', () => {
  it('renders only the center column without aside', () => {
    render(<PageColumns>center</PageColumns>)
    expect(screen.getByText('center')).toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('renders the right column as a complementary landmark', () => {
    render(<PageColumns aside={<p>widgets</p>}>center</PageColumns>)
    expect(screen.getByRole('complementary')).toHaveTextContent('widgets')
    expect(screen.getByText('center')).toBeInTheDocument()
  })
})
