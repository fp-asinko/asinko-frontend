import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ChoiceGroup } from './choice-group'

const OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'HIGH', label: 'High' },
] as const

function Group({ onChange = vi.fn(), invalid = false, required = false }) {
  const [value, setValue] = useState<'LOW' | 'HIGH' | undefined>(undefined)
  return (
    <>
      <span id="label">Conviction</span>
      <ChoiceGroup
        labelledBy="label"
        describedBy="help"
        options={OPTIONS}
        value={value}
        onChange={(next) => {
          setValue(next)
          onChange(next)
        }}
        invalid={invalid}
        required={required}
      />
      <p id="help">How sure you are</p>
    </>
  )
}

describe('ChoiceGroup (specs/thesis-create TC-05, TC-07)', () => {
  it('is a named radio group, none chosen at first, chosen with a tap', async () => {
    const onChange = vi.fn()
    render(<Group onChange={onChange} />)
    const group = screen.getByRole('radiogroup', { name: 'Conviction' })
    expect(group).toHaveAccessibleDescription('How sure you are')
    expect(screen.getByRole('radio', { name: 'Low' })).not.toBeChecked()

    await userEvent.click(screen.getByText('High'))
    expect(onChange).toHaveBeenCalledWith('HIGH')
    expect(screen.getByRole('radio', { name: 'High' })).toBeChecked()
  })

  it('moves with the arrows', async () => {
    const onChange = vi.fn()
    render(<Group onChange={onChange} />)
    await userEvent.click(screen.getByText('Low'))
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith('HIGH')
  })

  it('says it is invalid, and required', () => {
    render(<Group invalid required />)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('radiogroup')).toBeRequired()
  })
})
