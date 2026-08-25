import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { MotherboardSchematic } from '../../src/components/MotherboardSchematic'
import { liveRigTelemetry } from '../../src/data/mockData'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  })
})

describe('MotherboardSchematic', () => {
  it('gives two populated WMI DIMMs enough width and truncates long labels safely', () => {
    const telemetry = {
      ...liveRigTelemetry,
      ram: {
        ...liveRigTelemetry.ram,
        slots: [
          { slot: 'ChannelA-DIMM0', size: '8GB', status: 'active' as const },
          { slot: 'ChannelB-DIMM0', size: '8GB', status: 'active' as const },
        ],
      },
    }

    render(<MotherboardSchematic telemetry={telemetry} onInspect={() => undefined} />)

    expect(screen.getByTestId('dimm-slot-grid')).toHaveClass('grid-cols-2')
    const firstSlot = screen.getByText('ChannelA-DIMM0')
    expect(firstSlot).toHaveClass('truncate')
    expect(firstSlot).toHaveAttribute('title', 'ChannelA-DIMM0')
  })
})
