import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Announce } from './announce'

describe('Announce', () => {
  it('writes its text into the live region that stays, and clears it when it goes', () => {
    const { rerender, unmount } = render(
      <>
        <p id="live" role="status" />
        <Announce regionId="live" text="2 results" />
      </>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('2 results')
    rerender(
      <>
        <p id="live" role="status" />
        <Announce regionId="live" text="No results" />
      </>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('No results')
    unmount()
    expect(document.getElementById('live')).toBeNull()
  })

  it('does nothing without its region', () => {
    expect(() => render(<Announce regionId="missing" text="x" />)).not.toThrow()
  })
})
