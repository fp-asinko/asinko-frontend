import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageColumns } from './page-columns'

describe('PageColumns', () => {
  it('renders the center column content', () => {
    render(<PageColumns>center</PageColumns>)
    expect(screen.getByText('center')).toBeInTheDocument()
  })
})
