import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusMessage } from './status-message'

describe('StatusMessage', () => {
  it('renders the title as the page heading and the description', () => {
    render(<StatusMessage title="Page not found" description="It was moved." />)
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByText('It was moved.')).toBeInTheDocument()
  })

  it('renders the action when given', () => {
    render(
      <StatusMessage
        title="Error"
        description="Oops"
        action={<button type="button">Retry</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})
