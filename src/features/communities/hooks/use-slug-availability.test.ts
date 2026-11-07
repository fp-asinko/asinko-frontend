import { act, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateGroupForm, CreateGroupInput } from '../schemas/create-group.schema'
import { CHECK_DELAY_MS, useSlugAvailability } from './use-slug-availability'

const check = vi.hoisted(() => vi.fn())
vi.mock('../actions/check-group-slug.action', () => ({ checkGroupSlug: check }))

function setup() {
  return renderHook(() => {
    const form = useForm<CreateGroupForm, unknown, CreateGroupInput>({
      defaultValues: { name: '', slug: '', description: '', rules: '', mainUrl: '' },
    })
    return { form, ...useSlugAvailability(form) }
  })
}

/** Lets the debounce run out and the action's promise settle. */
async function wait() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(CHECK_DELAY_MS)
  })
}

describe('useSlugAvailability (specs/community-create CG-06, CG-07)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    check.mockReset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks once per pause and confirms a free handle', async () => {
    check.mockResolvedValue('free')
    const { result } = setup()
    act(() => result.current.form.setValue('slug', 'opt'))
    act(() => result.current.form.setValue('slug', 'options'))
    await wait()
    expect(check).toHaveBeenCalledTimes(1)
    expect(check).toHaveBeenCalledWith('options')
    expect(result.current.available).toBe('options')
  })

  it('marks a taken handle as the field error, and clears it when the handle changes', async () => {
    check.mockResolvedValue('taken')
    const { result } = setup()
    act(() => result.current.form.setValue('slug', 'defi'))
    await wait()
    expect(result.current.form.getFieldState('slug').error?.message).toBe(
      'createGroup.errors.slugTaken',
    )
    check.mockResolvedValue('free')
    act(() => result.current.form.setValue('slug', 'defi-latam'))
    expect(result.current.form.getFieldState('slug').error).toBeUndefined()
  })

  it('does not ask for a handle out of format, and drops an old answer', async () => {
    const { result } = setup()
    act(() => result.current.form.setValue('slug', 'ab'))
    act(() => result.current.form.setValue('slug', 'Bad slug'))
    await wait()
    expect(check).not.toHaveBeenCalled()

    let answer: (value: string) => void = () => {}
    check.mockReturnValue(new Promise((resolve) => (answer = resolve)))
    act(() => result.current.form.setValue('slug', 'first'))
    await wait()
    act(() => result.current.form.setValue('slug', 'second'))
    await act(async () => answer('free'))
    expect(result.current.available).toBeNull()
  })
})
