import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { MotherboardSchematic } from '../../src/components/MotherboardSchematic'
import { liveRigTelemetry } from '../../src/data/mockData'

beforeAll(() => vi.stubGlobal('ResizeObserver', class { observe() {}; disconnect() {} }))

describe('detected storage keyboard access', () => {
  it.each(['Enter', ' '])('opens a detected disk with %s', (key) => {
    const onInspect = vi.fn()
    const disk = {
      localId: 'disk:2',
      name: 'Archive SSD',
      capacityBytes: 2_000_000_000_000,
      capacityLabel: '2TB',
      mediaType: 'ssd' as const,
      busType: 'SATA',
      health: 'healthy' as const,
      operationalStatus: ['OK'],
      source: 'windows' as const,
      status: 'ok' as const,
      diagnostics: [],
    }
    const telemetry = {
      ...liveRigTelemetry,
      storage: { ...liveRigTelemetry.storage, devices: [disk] },
    }

    render(<MotherboardSchematic telemetry={telemetry} onInspect={onInspect} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Archive SSD/i }), { key })

    expect(onInspect).toHaveBeenCalledWith('storage:disk:2')
  })
})
