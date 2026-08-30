import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { MotherboardSchematic } from '../../src/components/MotherboardSchematic'
import { liveRigTelemetry } from '../../src/data/mockData'

beforeAll(() => vi.stubGlobal('ResizeObserver', class { observe() {}; disconnect() {} }))

describe('live storage collection', () => {
  it('renders every detected disk without a fake upgrade bay', () => {
    const devices = ['Alpha', 'Beta', 'Gamma'].map((name, index) => ({
      localId: `disk:${index}`, name: `Disk ${name}`, capacityBytes: 500_000_000_000,
      capacityLabel: index === 2 ? '2TB' : '500GB', mediaType: 'ssd' as const,
      busType: index === 1 ? 'NVMe' : 'SATA', health: 'healthy' as const,
      operationalStatus: ['OK'], source: 'windows' as const, status: 'ok' as const, diagnostics: [],
    }))
    const telemetry = { ...liveRigTelemetry, storage: { ...liveRigTelemetry.storage, devices } }

    render(<MotherboardSchematic telemetry={telemetry} onInspect={() => undefined} />)

    for (const device of devices) expect(screen.getByText(device.name)).toBeVisible()
    expect(screen.queryByText('Storage Bay #3')).not.toBeInTheDocument()
    expect(screen.queryByText('[Available for Upgrade]')).not.toBeInTheDocument()
  })
})
