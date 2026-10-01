import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AsinkoLogo } from './asinko-logo'

describe('AsinkoLogo', () => {
  it('is an image with the given accessible name', () => {
    render(<AsinkoLogo label="Asinko, go to home" />)
    expect(screen.getByRole('img', { name: 'Asinko, go to home' })).toBeInTheDocument()
  })

  it('uses the theme text color so it works in light and dark', () => {
    render(<AsinkoLogo label="Asinko" />)
    expect(screen.getByRole('img')).toHaveClass('text-foreground')
  })
})
