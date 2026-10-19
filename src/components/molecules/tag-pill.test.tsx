import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TagPill } from './tag-pill'

describe('TagPill (specs/drafts-tags DT-10)', () => {
  it("shows the tag's word", () => {
    render(<TagPill label="Analysis" />)
    expect(screen.getByText('Analysis')).toBeInTheDocument()
  })
})
