import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { arriving } from './arriving'

function Greeting({ name }: { name: string }) {
  return <p>Hello {name}</p>
}

describe('arriving (specs/content-reveal CR-01)', () => {
  it('renders the component with its props inside the fade wrapper', () => {
    const Arriving = arriving(Greeting)
    render(<Arriving name="Ana" />)
    const text = screen.getByText('Hello Ana')
    expect(text.parentElement).toHaveClass('arrive')
  })
})
