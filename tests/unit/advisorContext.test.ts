import { describe, expect, it } from 'vitest'

import { createLiveTelemetryBaseline, mergeNativeTelemetry } from '../../src/data/liveTelemetry'
import { fullRigTelemetry } from '../../src/data/mockData'
import { buildAdvisorContext } from '../../src/utils/advisorContext'
import { calculateHardwareSynergyScore } from '../../src/utils/scoreCalculator'
import { getDynamicInspectorItem } from '../../src/data/inspectorGenerator'

describe('buildAdvisorContext', () => {
  it('omits unavailable Live fields and placeholder values', () => {
    const telemetry = createLiveTelemetryBaseline()
    telemetry.telemetry.status = 'unavailable'
    const context = buildAdvisorContext(telemetry, calculateHardwareSynergyScore(telemetry, 'dev'))

    expect(context).toContain('Data source: LIVE HARDWARE')
    expect(context).toContain('Detection status: unavailable')
    expect(context).not.toContain('Unknown')
    expect(context).not.toContain('PSU:')
    expect(context).not.toContain('CPU temperature')
    expect(context).not.toContain('Motherboard:')
  })

  it('includes only fields detected by the native adapter', () => {
    const telemetry = mergeNativeTelemetry({
      host_name: 'WORKSTATION-01',
      cpu: {
        name: 'AMD Ryzen 7 9700X',
        cores: 8,
        threads: 16,
        current_load_pct: 23,
        per_core_loads: [18, 28],
      },
      ram: {
        total_gb: 32,
        channel_mode: 'Dual-Channel (inferred)',
        speed_mhz: 6000,
        is_single_channel: false,
      },
      motherboard: { manufacturer: 'MSI', model: 'B850 TOMAHAWK' },
      gpu: { name: 'NVIDIA GeForce RTX 4070', is_discrete: true, vram_mb: 12288 },
    })
    const context = buildAdvisorContext(telemetry, calculateHardwareSynergyScore(telemetry, 'creator'))

    expect(context).not.toContain('WORKSTATION-01')
    expect(context).toContain('CPU: AMD Ryzen 7 9700X (8C/16T)')
    expect(context).toContain('CPU load: 23%')
    expect(context).toContain('RAM: 32GB Dual-Channel (inferred)')
    expect(context).toContain('Motherboard: MSI B850 TOMAHAWK')
    expect(context).toContain('GPU: NVIDIA GeForce RTX 4070 (12GB, discrete)')
    expect(context).not.toContain('PSU:')
    expect(context).not.toContain('temperature')
  })

  it('explicitly labels simulator data and includes its supported PSU', () => {
    const context = buildAdvisorContext(
      fullRigTelemetry,
      calculateHardwareSynergyScore(fullRigTelemetry, 'dev'),
    )

    expect(context).toContain('Data source: SIMULATED PROFILE')
    expect(context).toContain('Hardware score: 98/100 (Grade S, high confidence)')
    expect(context).toContain('PSU: Corsair RM850x (ATX 3.0) (850W)')
    expect(context).toContain('CPU temperature: 56.2°C')
  })
})

describe('local inspector analysis', () => {
  it.each(['cpu', 'ram', 'mainboard', 'vrm', 'gpu', 'nvme1', 'cooler', 'psu', 'network'])(
    'does not present a fabricated numeric AI score for %s',
    (id) => {
      const item = getDynamicInspectorItem(id, fullRigTelemetry, 'EN', 'dev')

      expect(item.aiScore).not.toMatch(/\d+\s*\/\s*100/)
    },
  )
})
