import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { LevelBars } from './level-bars'

const LEVELS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'EXTREME', label: 'Extreme' },
] as const
type Value = (typeof LEVELS)[number]['value']

function Bars({ onChange = vi.fn(), invalid = false }) {
  const [value, setValue] = useState<Value | undefined>(undefined)
  return (
    <>
      <span id="label">Conviction</span>
      <LevelBars
        labelledBy="label"
        levels={LEVELS}
        value={value}
        onChange={(next) => {
          setValue(next)
          onChange(next)
        }}
        prompt="Choose your conviction"
        invalid={invalid}
        required
      />
    </>
  )
}

describe('LevelBars (specs/thesis-create TC-25)', () => {
  it('is a named, required radio group of bars, inviting to choose at first', () => {
    render(<Bars />)
    const group = screen.getByRole('radiogroup', { name: 'Conviction' })
    expect(group).toBeRequired()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
    expect(screen.getByText('Choose your conviction')).toBeVisible()
  })

  it('chooses a level with a tap and names it beside the bars', async () => {
    const onChange = vi.fn()
    render(<Bars onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'High' }))
    expect(onChange).toHaveBeenCalledWith('HIGH')
    expect(screen.getByRole('radio', { name: 'High' })).toBeChecked()
    expect(screen.getByText('High', { selector: 'span' })).toBeVisible()
  })

  it('moves with the arrows', async () => {
    const onChange = vi.fn()
    render(<Bars onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Medium' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith('HIGH')
  })

  it('says it is invalid', () => {
    render(<Bars invalid />)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
  })
})
