import { describe, expect, it } from 'vitest'

import { createLiveTelemetryBaseline, mergeNativeTelemetry } from '../../src/data/liveTelemetry'
import { fullRigTelemetry, missingRigTelemetry } from '../../src/data/mockData'
import type { NativeHardwareTelemetryPayload } from '../../src/types/hardware'

const nativePayload: NativeHardwareTelemetryPayload = {
  host_name: 'AERO-RIG',
  os_name: 'Windows 11',
  uptime_formatted: '03h 14m',
  cpu: {
    name: 'AMD Ryzen 9 9950X3D',
    cores: 16,
    threads: 32,
    max_clock_mhz: 5700,
    current_load_pct: 37,
    per_core_loads: [20, 54, 37, 41],
  },
  ram: {
    total_gb: 64,
    channel_mode: 'Dual-Channel (inferred)',
    speed_mhz: 6000,
    slots: [
      {
        slot: 'DIMM_A2',
        size: '32GB',
        speed_mhz: 6000,
        manufacturer: 'G.Skill',
        status: 'active',
      },
      {
        slot: 'DIMM_B2',
        size: '32GB',
        speed_mhz: 6000,
        manufacturer: 'G.Skill',
        status: 'active',
      },
    ],
    is_single_channel: false,
  },
  motherboard: {
    manufacturer: 'ASUS',
    model: 'ROG STRIX X870E-E',
    version: 'Rev 1.xx',
    bios_vendor: 'American Megatrends',
    bios_version: '1401',
    bios_date: '2026-07-18',
  },
  gpu: {
    name: 'NVIDIA GeForce RTX 5090',
    is_discrete: true,
    vram_mb: 32768,
    driver_version: '33.0.15.9000',
  },
  disks: [
    { model: 'Samsung SSD 990 PRO', size_gb: 2000, media_type: 'NVMe' },
    { model: 'Crucial T500', size_gb: 1000, media_type: 'NVMe' },
  ],
}

describe('createLiveTelemetryBaseline', () => {
  it('starts Live mode in a neutral scanning state', () => {
    const telemetry = createLiveTelemetryBaseline()

    expect(telemetry.telemetry.mode).toBe('live')
    expect(telemetry.telemetry.status).toBe('scanning')
    expect(Object.values(telemetry.telemetry.capabilities)).toEqual(
      expect.arrayContaining(Array(13).fill(false)),
    )
    expect(Object.values(telemetry.telemetry.capabilities).every((value) => value === false)).toBe(true)
  })

  it('never seeds Live mode with mock identity or sensor readings', () => {
    const telemetry = createLiveTelemetryBaseline()
    const serialized = JSON.stringify(telemetry)

    expect(serialized).not.toContain('Dell')
    expect(serialized).not.toContain('i5-8400')
    expect(telemetry.cpu.tempC).toBe(0)
    expect(telemetry.cpu.powerW).toBe(0)
    expect(telemetry.gpu.tempC).toBe(0)
    expect(telemetry.psu.currentLoadW).toBe(0)
    expect(telemetry.motherboard.vrm.tempC).toBe(0)
  })
})

describe('mergeNativeTelemetry', () => {
  it('maps only native identity and load capabilities into the Live baseline', () => {
    const telemetry = mergeNativeTelemetry(nativePayload)

    expect(telemetry.telemetry.status).toBe('ready')
    expect(telemetry.hostName).toBe('AERO-RIG')
    expect(telemetry.cpu).toMatchObject({
      name: 'AMD Ryzen 9 9950X3D',
      cores: 16,
      threads: 32,
      maxClockMhz: 5700,
      currentLoadPct: 37,
      perCoreLoads: [20, 54, 37, 41],
    })
    expect(telemetry.ram.totalGb).toBe(64)
    expect(telemetry.ram.frequencyMhz).toBe(3000)
    expect(telemetry.ram.slots).toHaveLength(2)
    expect(telemetry.motherboard.name).toContain('ROG STRIX X870E-E')
    expect(telemetry.motherboard.name).toContain('Rev 1.xx')
    expect(telemetry.motherboard.biosVersion).toBe('1401')
    expect(telemetry.gpu).toMatchObject({
      name: 'NVIDIA GeForce RTX 5090',
      isDiscrete: true,
      vram: '32GB',
      driverVersion: '33.0.15.9000',
    })
    expect(telemetry.storage.m2_1.name).toBe('Samsung SSD 990 PRO (2000GB)')
    expect(telemetry.storage.m2_2.name).toBe('Crucial T500 (1000GB)')

    expect(telemetry.telemetry.capabilities).toMatchObject({
      cpuIdentity: true,
      cpuLoad: true,
      cpuSensors: false,
      ramIdentity: true,
      ramTimings: false,
      motherboardIdentity: true,
      motherboardSensors: false,
      gpuIdentity: true,
      gpuSensors: false,
      storageIdentity: true,
      storageSensors: false,
      psu: false,
      network: false,
      peripherals: false,
    })
  })

  it('keeps omitted fields unavailable instead of borrowing simulator values', () => {
    const telemetry = mergeNativeTelemetry({
      host_name: 'PARTIAL-PC',
      cpu: { name: 'Intel Core Ultra 9' },
      disks: [],
    })

    expect(telemetry.cpu.name).toBe('Intel Core Ultra 9')
    expect(telemetry.cpu.tempC).toBe(0)
    expect(telemetry.motherboard.name).toBe('Unknown')
    expect(telemetry.psu.name).toBe('Unknown')
    expect(telemetry.network.name).toBe('Unknown')
    expect(telemetry.peripherals).toEqual([])
    expect(telemetry.telemetry.capabilities.cpuIdentity).toBe(true)
    expect(telemetry.telemetry.capabilities.cpuLoad).toBe(false)
    expect(telemetry.telemetry.capabilities.storageIdentity).toBe(false)
  })
})

describe('simulator telemetry metadata', () => {
  it.each([fullRigTelemetry, missingRigTelemetry])('labels simulator profiles and enables their dataset', (telemetry) => {
    expect(telemetry.telemetry.mode).toBe('simulated')
    expect(telemetry.telemetry.status).toBe('ready')
    expect(Object.values(telemetry.telemetry.capabilities).every(Boolean)).toBe(true)
  })
})
