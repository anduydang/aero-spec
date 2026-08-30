import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  acceptDynamicResponse,
  acceptStaticResponse,
  beginDynamicRequest,
  beginStaticRequest,
  createNativeTelemetryState,
  deriveFreshness,
  toHardwareTelemetry,
} from '../../src/data/nativeTelemetry'
import { useNativeTelemetry } from '../../src/hooks/useNativeTelemetry'
import type {
  DynamicSnapshotResponseV2,
  ProviderDiagnostic,
  StaticSnapshotResponseV2,
} from '../../src/types/nativeTelemetry'

const capturedAt = '2026-08-29T12:00:00Z'

const diagnostic = (provider: ProviderDiagnostic['provider'], code: string): ProviderDiagnostic => ({
  provider,
  status: 'error',
  capturedAt,
  durationMs: 5,
  code,
  message: 'Provider unavailable',
})

const staticResponse = (generation = 1): StaticSnapshotResponseV2 => ({
  schemaVersion: 2,
  generation,
  snapshotId: 'snapshot-redacted',
  capturedAt,
  inventory: {
    status: 'ok',
    capturedAt,
    durationMs: 20,
    data: {
      system: {
        status: 'ok',
        data: {
          localId: 'system:0',
          hostName: 'AERO-PC',
          osName: 'Windows 11',
          uptimeSeconds: 3_661,
        },
      },
      cpu: {
        status: 'ok',
        data: {
          localId: 'cpu:0',
          name: 'Intel Core i3-12100F',
          physicalCores: 4,
          logicalProcessors: 8,
          maxClockMhz: 4_300,
          l2CacheKib: 5_120,
          l3CacheKib: 12_288,
        },
      },
      motherboard: {
        status: 'ok',
        data: {
          localId: 'board:0',
          manufacturer: 'Gigabyte',
          product: 'B660M DS3H',
          biosVersion: 'F30',
        },
      },
      memoryModules: {
        status: 'ok',
        data: [
          {
            localId: 'dimm:0',
            deviceLocator: 'A2',
            capacityBytes: 8 * 1024 ** 3,
            configuredSpeedMtps: 3_200,
            manufacturer: 'G.Skill',
            partNumber: 'F4-3200C16-8GIS',
          },
          {
            localId: 'dimm:1',
            deviceLocator: 'B2',
            capacityBytes: 8 * 1024 ** 3,
            configuredSpeedMtps: 3_200,
            manufacturer: 'G.Skill',
            partNumber: 'F4-3200C16-8GIS-B',
          },
        ],
      },
      displayAdapters: {
        status: 'ok',
        data: [
          {
            localId: 'gpu:0',
            name: 'NVIDIA GeForce RTX 2060 SUPER',
            driverVersion: '32.0.15.7283',
          },
        ],
      },
    },
  },
  storage: {
    status: 'ok',
    capturedAt,
    durationMs: 12,
    data: {
      devices: {
        status: 'ok',
        data: [
          { localId: 'disk:0', model: 'Samsung 980 PRO', capacityBytes: 1_000_204_886_016, mediaType: 'ssd', busType: 'NVMe', health: 'healthy' },
          { localId: 'disk:1', model: 'Crucial MX500', capacityBytes: 500_107_862_016, mediaType: 'ssd', busType: 'SATA', health: 'healthy' },
          { localId: 'disk:2', model: 'WD Blue', capacityBytes: 2_000_398_934_016, mediaType: 'hdd', busType: 'SATA', health: 'warning' },
        ],
      },
    },
  },
  pnp: {
    status: 'partial',
    capturedAt,
    durationMs: 18,
    data: {
      networks: {
        status: 'error',
        data: null,
        diagnostic: diagnostic('windows-pnp', 'NETWORK_QUERY_FAILED'),
      },
      displays: {
        status: 'ok',
        data: [{ localId: 'display:0', name: 'Acer XV272U', category: 'display', status: 'OK' }],
      },
      inputDevices: {
        status: 'ok',
        data: [
          { localId: 'input:0', name: 'Logitech G Pro', category: 'pointing', status: 'OK' },
          { localId: 'input:1', name: 'USB Keyboard', category: 'keyboard', status: 'OK' },
        ],
      },
      audioDevices: {
        status: 'ok',
        data: [{ localId: 'audio:0', name: 'Realtek Audio', category: 'audio', status: 'OK' }],
      },
    },
  },
})

const dynamicResponse = (generation = 1, inventoryGeneration = 1): DynamicSnapshotResponseV2 => ({
  schemaVersion: 2,
  generation,
  inventoryGeneration,
  capturedAt,
  dynamic: {
    status: 'ok',
    capturedAt,
    durationMs: 5,
    data: { cpuLoadPercent: 37 },
  },
  nvidia: {
    status: 'ok',
    capturedAt,
    durationMs: 8,
    data: {
      gpus: [{
        localId: 'gpu:0',
        name: 'NVIDIA GeForce RTX 2060 SUPER',
        memoryTotalMib: 8_192,
        temperatureC: 56,
        utilizationPercent: 41,
        powerDrawW: 126,
        driverVersion: '572.83',
      }],
    },
  },
})

const acceptedState = (receivedAtMs = 1_000) => {
  let state = createNativeTelemetryState()
  const staticRequest = beginStaticRequest(state)
  state = acceptStaticResponse(staticRequest.state, staticResponse(staticRequest.request.generation), receivedAtMs)
  const dynamicRequest = beginDynamicRequest(state)
  state = acceptDynamicResponse(
    dynamicRequest.state,
    dynamicResponse(dynamicRequest.request!.generation, dynamicRequest.request!.inventoryGeneration),
    receivedAtMs,
  )
  return state
}

describe('native telemetry adapter', () => {
  it('maps every DIMM part number, all disks, NVIDIA VRAM, and categorized devices', () => {
    const telemetry = toHardwareTelemetry(acceptedState(), 2_000)

    expect(telemetry.ram.slots.map((slot) => slot.partNumber)).toEqual([
      'F4-3200C16-8GIS',
      'F4-3200C16-8GIS-B',
    ])
    expect(telemetry.storage.devices).toHaveLength(3)
    expect(telemetry.storage.devices?.map((disk) => disk.name)).toEqual([
      'Samsung 980 PRO',
      'Crucial MX500',
      'WD Blue',
    ])
    expect(telemetry.gpu.vram).toBe('8GB')
    expect(telemetry.networks).toEqual([])
    expect(telemetry.connectedDevices?.display[0].name).toBe('Acer XV272U')
    expect(telemetry.connectedDevices?.input.map((device) => device.type)).toEqual(['mouse', 'keyboard'])
    expect(telemetry.connectedDevices?.audio[0].name).toBe('Realtek Audio')
  })

  it('preserves independent partial leaf states and diagnostics', () => {
    const telemetry = toHardwareTelemetry(acceptedState(), 2_000)

    expect(telemetry.telemetry.status).toBe('partial')
    expect(telemetry.telemetry.capabilities.network).toBe(false)
    expect(telemetry.telemetry.capabilities.peripherals).toBe(true)
    expect(telemetry.telemetry.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'NETWORK_QUERY_FAILED' })]),
    )
  })

  it('never treats a Windows display-adapter memory field as authoritative VRAM', () => {
    const response = staticResponse()
    const adapter = response.inventory.data!.displayAdapters.data![0] as typeof response.inventory.data.displayAdapters.data[0] & { adapterRam: number }
    adapter.adapterRam = 4_294_967_295
    let state = createNativeTelemetryState()
    const request = beginStaticRequest(state)
    state = acceptStaticResponse(request.state, response, 1_000)

    expect(toHardwareTelemetry(state, 2_000).gpu.vram).toBe('Unknown')
  })
})

describe('native telemetry generation and freshness store', () => {
  it('rejects static and dynamic completions older than the latest request', () => {
    let state = createNativeTelemetryState()
    const staticOne = beginStaticRequest(state)
    const staticTwo = beginStaticRequest(staticOne.state)
    state = acceptStaticResponse(staticTwo.state, staticResponse(staticOne.request.generation), 1_000)
    expect(state.staticResponse).toBeNull()
    state = acceptStaticResponse(state, staticResponse(staticTwo.request.generation), 1_100)

    const dynamicOne = beginDynamicRequest(state)
    const dynamicTwo = beginDynamicRequest(dynamicOne.state)
    state = acceptDynamicResponse(dynamicTwo.state, dynamicResponse(dynamicOne.request!.generation, staticTwo.request.generation), 1_200)
    expect(state.dynamic.lastSuccess).toBeNull()
    state = acceptDynamicResponse(dynamicTwo.state, dynamicResponse(dynamicTwo.request!.generation, 999), 1_300)
    expect(state.dynamic.lastSuccess).toBeNull()
  })

  it('derives fresh, stale, and unavailable transitions from injected monotonic time', () => {
    expect(deriveFreshness(1_000, 11_000)).toEqual({ freshness: 'fresh', ageSeconds: 10, badge: undefined })
    expect(deriveFreshness(1_000, 12_000)).toEqual({ freshness: 'stale', ageSeconds: 11, badge: 'Stale · 11s' })
    expect(deriveFreshness(1_000, 31_000)).toEqual({ freshness: 'stale', ageSeconds: 30, badge: 'Stale · 30s' })
    expect(deriveFreshness(1_000, 32_000)).toEqual({ freshness: 'unavailable', ageSeconds: 31, badge: 'Unavailable' })
  })

  it('keeps the last successful values visible with stale age and badge data', () => {
    const telemetry = toHardwareTelemetry(acceptedState(1_000), 12_000)

    expect(telemetry.cpu.currentLoadPct).toBe(37)
    expect(telemetry.gpu.tempC).toBe(56)
    expect(telemetry.telemetry.providers?.['windows-dynamic']).toMatchObject({
      freshness: 'stale',
      ageSeconds: 11,
      badge: 'Stale · 11s',
    })
    expect(telemetry.telemetry.status).toBe('partial')
  })
})

describe('useNativeTelemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('marks browser preview unavailable without invoking or using simulator data', async () => {
    const invoke = vi.fn()
    const { result } = renderHook(() => useNativeTelemetry({ invoke, isNative: () => false }))

    await act(async () => { await Promise.resolve() })
    expect(result.current.telemetry.telemetry.status).toBe('unavailable')
    expect(invoke).not.toHaveBeenCalled()
    expect(result.current.telemetry.telemetry.mode).toBe('live')
    expect(result.current.telemetry.cpu.name).toBe('Unknown')
  })

  it('polls only while visible and refreshes dynamic telemetry immediately when visibility returns', async () => {
    const invoke = vi.fn(async (command: string, args?: { request?: { generation: number; inventoryGeneration?: number } }) => {
      if (command === 'get_static_snapshot_v2') return staticResponse(args!.request!.generation)
      return dynamicResponse(args!.request!.generation, args!.request!.inventoryGeneration)
    })

    renderHook(() => useNativeTelemetry({ invoke, isNative: () => true, now: () => performance.now() }))
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(invoke).toHaveBeenCalledWith('get_static_snapshot_v2', expect.anything())
    expect(invoke).toHaveBeenCalledWith('get_dynamic_snapshot_v2', expect.anything())
    invoke.mockClear()

    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await act(async () => { await vi.advanceTimersByTimeAsync(6_000) })
    expect(invoke).not.toHaveBeenCalled()

    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith('get_dynamic_snapshot_v2', expect.anything())

    await act(async () => { await vi.advanceTimersByTimeAsync(3_000) })
    expect(invoke).toHaveBeenCalledTimes(2)
  })
})
