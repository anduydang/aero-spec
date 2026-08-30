import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { PSU_PROFILE_STORAGE_KEY, usePsuProfile } from '../../src/hooks/usePsuProfile'

describe('usePsuProfile', () => {
  beforeEach(() => localStorage.clear())

  it('persists only the supported manual PSU fields', () => {
    const { result } = renderHook(() => usePsuProfile())

    act(() => result.current.save({
      brandModel: 'Corsair RM850x',
      ratedWattage: 850,
      efficiency: '80 Plus Gold',
      note: 'User-entered label',
      currentLoadW: 420,
    } as never))

    expect(JSON.parse(localStorage.getItem(PSU_PROFILE_STORAGE_KEY) ?? '{}')).toEqual({
      brandModel: 'Corsair RM850x',
      ratedWattage: 850,
      efficiency: '80 Plus Gold',
      note: 'User-entered label',
    })
  })

  it('clears the local profile', () => {
    localStorage.setItem(PSU_PROFILE_STORAGE_KEY, JSON.stringify({ brandModel: 'Existing' }))
    const { result } = renderHook(() => usePsuProfile())

    act(() => result.current.clear())

    expect(result.current.profile).toBeNull()
    expect(localStorage.getItem(PSU_PROFILE_STORAGE_KEY)).toBeNull()
  })
})
