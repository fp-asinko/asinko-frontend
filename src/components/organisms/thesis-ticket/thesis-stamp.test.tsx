import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThesisSerial, ThesisStamp } from './thesis-stamp'

describe('ThesisStamp (specs/thesis-identity TI-14, TI-15)', () => {
  it.each([
    ['correct', 'Correct', 'bg-thesis-correct'],
    ['incorrect', 'Incorrect', 'bg-thesis-incorrect'],
    ['disputed', 'Disputed', 'bg-background'],
    ['expired', 'Expired', 'bg-background'],
    ['cancelled', 'Cancelled', 'bg-background'],
  ] as const)('stamps a %s thesis, decorative', (state, word, tint) => {
    const { container } = renderWithIntl(<ThesisStamp state={state} />)
    const stamp = container.querySelector(`[data-stamp="${state}"]`)!
    expect(stamp).toHaveTextContent(word)
    expect(stamp).toHaveAttribute('aria-hidden', 'true')
    expect(stamp).toHaveClass(tint)
  })

  it('has none while open (Q3)', () => {
    const { container } = renderWithIntl(<ThesisStamp state="open" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('ThesisSerial (specs/thesis-number TN-01, TN-04)', () => {
  it('stamps "#12" for the eye and says it in words to the screen reader', () => {
    const { container } = renderWithIntl(
      <ThesisSerial number={12} label="Thesis number 12 by maria" />,
    )
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('#12')
    expect(screen.getByText('Thesis number 12 by maria')).toHaveClass('sr-only')
  })
})
