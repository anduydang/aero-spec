import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { usePsuProfile } from '../../src/hooks/usePsuProfile'

describe('manual PSU profile synchronization', () => {
  beforeEach(() => localStorage.clear())

  it('updates every mounted consumer after a local save', () => {
    const { result } = renderHook(() => ({ first: usePsuProfile(), second: usePsuProfile() }))

    act(() => result.current.first.save({
      brandModel: 'Seasonic Focus GX',
      ratedWattage: 750,
      efficiency: 'Gold',
      note: '',
    }))

    expect(result.current.second.profile?.brandModel).toBe('Seasonic Focus GX')
  })
})
