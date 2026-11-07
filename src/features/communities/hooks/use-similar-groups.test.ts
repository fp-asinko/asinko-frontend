import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SIMILAR_DELAY_MS, useSimilarGroups } from './use-similar-groups'

const find = vi.hoisted(() => vi.fn())
vi.mock('../actions/find-similar-groups.action', () => ({ findSimilarGroups: find }))

const defi = { handle: '#defi', name: 'DeFi', memberCount: 120, path: '/hub/defi' }

async function wait() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(SIMILAR_DELAY_MS)
  })
}

describe('useSimilarGroups (specs/community-create CG-22)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    find.mockReset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks once per pause, and only from three characters', async () => {
    find.mockResolvedValue([defi])
    const { result, rerender } = renderHook(({ name }) => useSimilarGroups(name), {
      initialProps: { name: 'de' },
    })
    await wait()
    expect(find).not.toHaveBeenCalled()
    rerender({ name: 'def' })
    rerender({ name: 'defi ' })
    await wait()
    expect(find).toHaveBeenCalledTimes(1)
    expect(find).toHaveBeenCalledWith('defi')
    expect(result.current).toEqual([defi])
  })

  it('shows nothing for a name that changed since asking', async () => {
    find.mockResolvedValue([defi])
    const { result, rerender } = renderHook(({ name }) => useSimilarGroups(name), {
      initialProps: { name: 'defi' },
    })
    await wait()
    rerender({ name: 'defi latam' })
    expect(result.current).toEqual([])
  })
})
