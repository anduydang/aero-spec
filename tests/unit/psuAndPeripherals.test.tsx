import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { PsuAndPeripherals } from '../../src/components/PsuAndPeripherals'
import { fullRigTelemetry } from '../../src/data/mockData'
import { PSU_PROFILE_STORAGE_KEY } from '../../src/hooks/usePsuProfile'

const liveWithoutPsu = {
  ...fullRigTelemetry,
  telemetry: {
    ...fullRigTelemetry.telemetry,
    mode: 'live' as const,
    capabilities: {
      ...fullRigTelemetry.telemetry.capabilities,
      psu: false,
      network: true,
      peripherals: true,
    },
  },
  networks: [
    { localId: 'network:0', name: 'Ethernet Controller', interfaceName: 'Ethernet', linkSpeedBps: 1_000_000_000, mediaType: '802.3', connected: true, source: 'windows' as const, status: 'ok' as const, diagnostics: [] },
    { localId: 'network:1', name: 'Wi-Fi Adapter', interfaceName: 'WiFi', linkSpeedBps: 0, mediaType: 'Native 802.11', connected: false, source: 'windows' as const, status: 'ok' as const, diagnostics: [] },
  ],
}

describe('PsuAndPeripherals', () => {
  beforeEach(() => localStorage.clear())

  it('keeps every detected network and device visible when PSU identity is unavailable', () => {
    render(<PsuAndPeripherals telemetry={liveWithoutPsu} onInspect={() => undefined} peripheralsTitle="Connected Devices" />)

    expect(screen.getByText('PSU not detected')).toBeVisible()
    expect(screen.getByText('Ethernet Controller')).toBeVisible()
    expect(screen.getByText('Wi-Fi Adapter')).toBeVisible()
    expect(screen.getByText(liveWithoutPsu.peripherals[0].name)).toBeVisible()
  })

  it('labels a locally entered PSU as Manual and never invents sensor values', () => {
    localStorage.setItem(PSU_PROFILE_STORAGE_KEY, JSON.stringify({ brandModel: 'Corsair RM850x', ratedWattage: 850, efficiency: '80 Plus Gold', note: '' }))

    render(<PsuAndPeripherals telemetry={liveWithoutPsu} onInspect={() => undefined} peripheralsTitle="Connected Devices" />)

    expect(screen.getByText('Manual')).toBeVisible()
    expect(screen.getByText('Corsair RM850x')).toBeVisible()
    expect(screen.queryByText(/\+12V/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Load:/)).not.toBeInTheDocument()
  })
})
