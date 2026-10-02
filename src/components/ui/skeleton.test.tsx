import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './skeleton'

// Tests the asinko modification to the shadcn component (testing.md § Reglas 2).
describe('Skeleton', () => {
  it('only pulses when the user allows motion', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.firstElementChild
    expect(skeleton).toHaveClass('motion-safe:animate-pulse')
    expect(skeleton).not.toHaveClass('animate-pulse')
  })
})
