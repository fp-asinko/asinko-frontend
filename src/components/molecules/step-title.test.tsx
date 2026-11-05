import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { StepTitle } from './step-title'

describe('StepTitle (specs/thesis-form-steps FS-08, FS-09)', () => {
  it('shows its number and says which step it is', () => {
    const { container } = renderWithIntl(
      <>
        <label htmlFor="f">
          <StepTitle n={2} total={6}>
            Claim
          </StepTitle>
        </label>
        <input id="f" />
      </>,
    )
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('2')
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Step 2 of 6: Claim')
  })

  it('turns to ✓ once done, and says so in words', () => {
    const { container } = renderWithIntl(
      <>
        <label htmlFor="f">
          <StepTitle n={1} total={6} done>
            Asset
          </StepTitle>
        </label>
        <input id="f" />
      </>,
    )
    expect(container.querySelector('[aria-hidden] svg')).not.toBeNull()
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Step 1 of 6, done: Asset')
  })
})
