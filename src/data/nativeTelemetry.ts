import { createLiveTelemetryBaseline } from './liveTelemetry'
import type {
  HardwareConnectedDevice,
  HardwareNetworkDevice,
  HardwareStorageDevice,
  HardwareTelemetryState,
  TelemetryFreshness,
  TelemetryProviderState,
} from '../types/hardware'
import type {
  DynamicData,
  DynamicSnapshotRequestV2,
  DynamicSnapshotResponseV2,
  NvidiaData,
  PnpDevice,
  ProviderDiagnostic,
  QueryResult,
  Section,
  StaticSnapshotRequestV2,
  StaticSnapshotResponseV2,
} from '../types/nativeTelemetry'

interface LastSuccess<T> {
  section: Section<T>
  receivedAtMs: number
}

interface DynamicProviderStore<T> {
  lastSuccess: LastSuccess<T> | null
  diagnostic?: ProviderDiagnostic
}

export interface NativeTelemetryState {
  latestStaticGeneration: number
  latestDynamicGeneration: number
  inventoryGeneration: number | null
  staticResponse: StaticSnapshotResponseV2 | null
  staticReceivedAtMs: number | null
  dynamic: DynamicProviderStore<DynamicData>
  nvidia: DynamicProviderStore<NvidiaData>
  availability: 'scanning' | 'available' | 'unavailable' | 'error'
  error?: string
}

export interface FreshnessResult {
  freshness: TelemetryFreshness
  ageSeconds: number
  badge?: string
}

export function createNativeTelemetryState(): NativeTelemetryState {
  return {
    latestStaticGeneration: 0,
    latestDynamicGeneration: 0,
    inventoryGeneration: null,
    staticResponse: null,
    staticReceivedAtMs: null,
    dynamic: { lastSuccess: null },
    nvidia: { lastSuccess: null },
    availability: 'scanning',
  }
}

export function beginStaticRequest(state: NativeTelemetryState): {
  state: NativeTelemetryState
  request: StaticSnapshotRequestV2
} {
  const generation = state.latestStaticGeneration + 1
  return {
    state: { ...state, latestStaticGeneration: generation, availability: 'scanning', error: undefined },
    request: { schemaVersion: 2, generation },
  }
}

export function acceptStaticResponse(
  state: NativeTelemetryState,
  response: StaticSnapshotResponseV2,
  receivedAtMs: number,
): NativeTelemetryState {
  if (response.schemaVersion !== 2 || response.generation !== state.latestStaticGeneration) return state

  return {
    ...state,
    inventoryGeneration: response.generation,
    staticResponse: response,
    staticReceivedAtMs: receivedAtMs,
    dynamic: { lastSuccess: null },
    nvidia: { lastSuccess: null },
    availability: 'available',
    error: undefined,
  }
}

export function beginDynamicRequest(state: NativeTelemetryState): {
  state: NativeTelemetryState
  request: DynamicSnapshotRequestV2 | null
} {
  if (state.inventoryGeneration === null) return { state, request: null }
  const generation = state.latestDynamicGeneration + 1
  return {
    state: { ...state, latestDynamicGeneration: generation },
    request: { schemaVersion: 2, generation, inventoryGeneration: state.inventoryGeneration },
  }
}

function acceptProviderSection<T>(
  current: DynamicProviderStore<T>,
  section: Section<T>,
  receivedAtMs: number,
): DynamicProviderStore<T> {
  if ((section.status === 'ok' || section.status === 'partial') && section.data !== null) {
    return {
      lastSuccess: { section, receivedAtMs },
      diagnostic: section.diagnostic,
    }
  }
  return { ...current, diagnostic: section.diagnostic }
}

export function acceptDynamicResponse(
  state: NativeTelemetryState,
  response: DynamicSnapshotResponseV2,
  receivedAtMs: number,
): NativeTelemetryState {
  if (
    response.schemaVersion !== 2
    || response.generation !== state.latestDynamicGeneration
    || response.inventoryGeneration !== state.inventoryGeneration
  ) return state

  return {
    ...state,
    dynamic: acceptProviderSection(state.dynamic, response.dynamic, receivedAtMs),
    nvidia: acceptProviderSection(state.nvidia, response.nvidia, receivedAtMs),
  }
}

export function markNativeUnavailable(state: NativeTelemetryState): NativeTelemetryState {
  return { ...state, availability: 'unavailable', error: undefined }
}

export function markNativeError(state: NativeTelemetryState, error: unknown): NativeTelemetryState {
  return {
    ...state,
    availability: 'error',
    error: error instanceof Error ? error.message : String(error),
  }
}

export function deriveFreshness(receivedAtMs: number | null, nowMs: number): FreshnessResult {
  if (receivedAtMs === null) return { freshness: 'unavailable', ageSeconds: 0, badge: 'Unavailable' }
  const ageSeconds = Math.max(0, Math.floor((nowMs - receivedAtMs) / 1_000))
  if (ageSeconds <= 10) return { freshness: 'fresh', ageSeconds, badge: undefined }
  if (ageSeconds <= 30) return { freshness: 'stale', ageSeconds, badge: `Stale · ${ageSeconds}s` }
  return { freshness: 'unavailable', ageSeconds, badge: 'Unavailable' }
}

const hasData = <T>(query: QueryResult<T> | undefined): query is QueryResult<T> & { data: T } =>
  query?.status === 'ok' && query.data !== null

const queryDiagnostics = (...queries: Array<QueryResult<unknown> | undefined>) =>
  queries.flatMap((query) => query?.diagnostic ? [query.diagnostic] : [])

const sectionDiagnostics = (section: Section<unknown> | undefined) =>
  section?.diagnostic ? [section.diagnostic] : []

const gibibytes = (bytes: number) => Math.round((bytes / 1024 ** 3) * 10) / 10

const capacityLabel = (bytes: number) => {
  const terabytes = bytes / 1_000_000_000_000
  if (terabytes >= 1) return `${Math.round(terabytes * 10) / 10}TB`
  return `${Math.round(bytes / 1_000_000_000)}GB`
}

const uptimeLabel = (seconds: number | undefined) => {
  if (seconds === undefined) return 'Unknown'
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
}

const providerState = (
  source: TelemetryProviderState['source'],
  success: LastSuccess<unknown> | null,
  diagnostic: ProviderDiagnostic | undefined,
  nowMs: number,
): TelemetryProviderState => ({
  ...deriveFreshness(success?.receivedAtMs ?? null, nowMs),
  source,
  diagnostic,
})

const connectedDevice = (
  device: PnpDevice,
  type: HardwareConnectedDevice['type'],
  status: HardwareConnectedDevice['status'],
  diagnostics: ProviderDiagnostic[],
): HardwareConnectedDevice => ({
  localId: device.localId,
  name: device.name,
  type,
  manufacturer: device.manufacturer,
  deviceStatus: device.status,
  source: 'windows',
  status,
  diagnostics,
})

function getPnpData<T>(query: QueryResult<T[]> | undefined): T[] {
  return hasData(query) ? query.data : []
}

export function toHardwareTelemetry(state: NativeTelemetryState, nowMs: number): HardwareTelemetryState {
  const baseline = createLiveTelemetryBaseline()
  if (state.availability === 'unavailable') {
    return { ...baseline, telemetry: { ...baseline.telemetry, status: 'unavailable' } }
  }
  if (state.availability === 'error' && !state.staticResponse) {
    return { ...baseline, telemetry: { ...baseline.telemetry, status: 'error', error: state.error } }
  }
  const response = state.staticResponse
  if (!response) return baseline

  const inventory = response.inventory.data
  const storage = response.storage.data
  const pnp = response.pnp.data
  const system = hasData(inventory?.system) ? inventory.system.data : undefined
  const cpu = hasData(inventory?.cpu) ? inventory.cpu.data : undefined
  const board = hasData(inventory?.motherboard) ? inventory.motherboard.data : undefined
  const memoryModules = getPnpData(inventory?.memoryModules)
  const displayAdapters = getPnpData(inventory?.displayAdapters)
  const storageDevices = getPnpData(storage?.devices)
  const networkDevices = getPnpData(pnp?.networks)
  const displays = getPnpData(pnp?.displays)
  const inputs = getPnpData(pnp?.inputDevices)
  const audio = getPnpData(pnp?.audioDevices)
  const dynamicFreshness = deriveFreshness(state.dynamic.lastSuccess?.receivedAtMs ?? null, nowMs)
  const nvidiaFreshness = deriveFreshness(state.nvidia.lastSuccess?.receivedAtMs ?? null, nowMs)
  const dynamicData = dynamicFreshness.freshness === 'unavailable'
    ? undefined
    : state.dynamic.lastSuccess?.section.data ?? undefined
  const nvidiaGpus = nvidiaFreshness.freshness === 'unavailable'
    ? []
    : state.nvidia.lastSuccess?.section.data?.gpus ?? []
  const primaryAdapter = displayAdapters[0]
  const matchedNvidia = primaryAdapter
    ? nvidiaGpus.find((gpu) => gpu.localId === primaryAdapter.localId)
    : nvidiaGpus[0]

  const storageDiagnostics = queryDiagnostics(storage?.devices)
  const mappedStorage: HardwareStorageDevice[] = storageDevices.map((device) => ({
    localId: device.localId,
    name: device.model,
    capacityBytes: device.capacityBytes,
    capacityLabel: capacityLabel(device.capacityBytes),
    mediaType: device.mediaType ?? 'unspecified',
    busType: device.busType ?? 'Unknown',
    health: device.health ?? 'unknown',
    operationalStatus: device.operationalStatus ?? [],
    source: 'windows',
    status: storage?.devices.status ?? 'error',
    diagnostics: storageDiagnostics,
  }))

  const networkDiagnostics = queryDiagnostics(pnp?.networks)
  const mappedNetworks: HardwareNetworkDevice[] = networkDevices.map((device) => ({
    localId: device.localId,
    name: device.name,
    interfaceName: device.interfaceName,
    linkSpeedBps: device.linkSpeedBps,
    mediaType: device.mediaType,
    connected: device.connected,
    source: 'windows',
    status: pnp?.networks.status ?? 'error',
    diagnostics: networkDiagnostics,
  }))

  const displayDiagnostics = queryDiagnostics(pnp?.displays)
  const inputDiagnostics = queryDiagnostics(pnp?.inputDevices)
  const audioDiagnostics = queryDiagnostics(pnp?.audioDevices)
  const connectedDisplays = displays.map((device) => connectedDevice(device, 'display', pnp?.displays.status ?? 'error', displayDiagnostics))
  const connectedInputs = inputs.map((device) => connectedDevice(
    device,
    device.category === 'keyboard' ? 'keyboard' : 'mouse',
    pnp?.inputDevices.status ?? 'error',
    inputDiagnostics,
  ))
  const connectedAudio = audio.map((device) => connectedDevice(device, 'audio', pnp?.audioDevices.status ?? 'error', audioDiagnostics))
  const diagnostics = [
    ...sectionDiagnostics(response.inventory),
    ...sectionDiagnostics(response.storage),
    ...sectionDiagnostics(response.pnp),
    ...queryDiagnostics(
      inventory?.system,
      inventory?.cpu,
      inventory?.motherboard,
      inventory?.memoryModules,
      inventory?.displayAdapters,
      storage?.devices,
      pnp?.networks,
      pnp?.displays,
      pnp?.inputDevices,
      pnp?.audioDevices,
    ),
    ...(state.dynamic.diagnostic ? [state.dynamic.diagnostic] : []),
    ...(state.nvidia.diagnostic ? [state.nvidia.diagnostic] : []),
  ]

  const staticPartial = [response.inventory.status, response.storage.status, response.pnp.status].includes('partial')
  const dynamicDegraded = state.dynamic.lastSuccess !== null && dynamicFreshness.freshness !== 'fresh'
  const coreAvailable = Boolean(system && cpu)
  const status = !coreAvailable
    ? 'error'
    : staticPartial || dynamicDegraded
      ? 'partial'
      : 'ready'
  const firstDisk = mappedStorage[0]
  const secondDisk = mappedStorage[1]
  const firstNetwork = mappedNetworks[0]

  return {
    ...baseline,
    telemetry: {
      mode: 'live',
      status,
      diagnostics,
      providers: {
        'windows-dynamic': providerState('windows', state.dynamic.lastSuccess, state.dynamic.diagnostic, nowMs),
        nvidia: providerState('nvidia', state.nvidia.lastSuccess, state.nvidia.diagnostic, nowMs),
      },
      capabilities: {
        ...baseline.telemetry.capabilities,
        cpuIdentity: Boolean(cpu),
        cpuLoad: dynamicData?.cpuLoadPercent !== undefined,
        ramIdentity: memoryModules.length > 0,
        motherboardIdentity: Boolean(board),
        gpuIdentity: Boolean(primaryAdapter),
        gpuSensors: Boolean(matchedNvidia && (
          matchedNvidia.temperatureC !== undefined
          || matchedNvidia.utilizationPercent !== undefined
          || matchedNvidia.powerDrawW !== undefined
        )),
        storageIdentity: mappedStorage.length > 0,
        network: mappedNetworks.length > 0,
        peripherals: connectedDisplays.length + connectedInputs.length + connectedAudio.length > 0,
      },
    },
    hostName: system?.hostName?.trim() || baseline.hostName,
    uptime: uptimeLabel(system?.uptimeSeconds),
    isLiveDetected: true,
    cpu: {
      ...baseline.cpu,
      name: cpu?.name.trim() || baseline.cpu.name,
      cores: cpu?.physicalCores ?? baseline.cpu.cores,
      threads: cpu?.logicalProcessors ?? baseline.cpu.threads,
      maxClockMhz: cpu?.maxClockMhz ?? baseline.cpu.maxClockMhz,
      cache: cpu
        ? [cpu.l2CacheKib && `${cpu.l2CacheKib} KiB L2`, cpu.l3CacheKib && `${cpu.l3CacheKib} KiB L3`].filter(Boolean).join(' / ') || 'Unknown'
        : baseline.cpu.cache,
      currentLoadPct: dynamicData?.cpuLoadPercent ?? baseline.cpu.currentLoadPct,
    },
    ram: {
      ...baseline.ram,
      totalGb: Math.round(memoryModules.reduce((total, module) => total + gibibytes(module.capacityBytes), 0) * 10) / 10,
      config: memoryModules.length > 0
        ? `${memoryModules.length}x ${gibibytes(memoryModules[0].capacityBytes)}GB @ ${memoryModules[0].configuredSpeedMtps ?? 0} MT/s`
        : baseline.ram.config,
      frequencyMhz: memoryModules[0]?.configuredSpeedMtps ? memoryModules[0].configuredSpeedMtps / 2 : baseline.ram.frequencyMhz,
      slots: memoryModules.map((module, index) => ({
        slot: module.deviceLocator || module.bankLabel || `DIMM ${index + 1}`,
        size: `${gibibytes(module.capacityBytes)}GB`,
        status: 'active' as const,
        label: module.manufacturer,
        partNumber: module.partNumber,
        source: 'windows' as const,
      })),
    },
    motherboard: {
      ...baseline.motherboard,
      name: [board?.manufacturer, board?.product, board?.version].filter(Boolean).join(' ') || baseline.motherboard.name,
      biosVendor: board?.biosVendor ?? baseline.motherboard.biosVendor,
      biosVersion: board?.biosVersion ?? baseline.motherboard.biosVersion,
      biosDate: board?.biosReleaseDate ?? baseline.motherboard.biosDate,
    },
    storage: {
      ...baseline.storage,
      devices: mappedStorage,
      m2_1: firstDisk ? {
        ...baseline.storage.m2_1,
        name: `${firstDisk.name} (${firstDisk.capacityLabel})`,
        lane: [firstDisk.busType, firstDisk.mediaType.toUpperCase()].filter(Boolean).join(' · '),
        isPopulated: true,
      } : baseline.storage.m2_1,
      m2_2: secondDisk ? {
        ...baseline.storage.m2_2,
        name: `${secondDisk.name} (${secondDisk.capacityLabel})`,
        lane: [secondDisk.busType, secondDisk.mediaType.toUpperCase()].filter(Boolean).join(' · '),
        isPopulated: true,
      } : baseline.storage.m2_2,
    },
    gpu: {
      ...baseline.gpu,
      name: primaryAdapter?.name ?? baseline.gpu.name,
      isDiscrete: Boolean(primaryAdapter),
      vram: matchedNvidia?.memoryTotalMib
        ? matchedNvidia.memoryTotalMib % 1024 === 0
          ? `${matchedNvidia.memoryTotalMib / 1024}GB`
          : `${matchedNvidia.memoryTotalMib}MB`
        : baseline.gpu.vram,
      tempC: matchedNvidia?.temperatureC ?? baseline.gpu.tempC,
      powerW: matchedNvidia?.powerDrawW ?? baseline.gpu.powerW,
      driverVersion: matchedNvidia?.driverVersion ?? primaryAdapter?.driverVersion ?? baseline.gpu.driverVersion,
    },
    psu: { ...baseline.psu, provenance: 'unavailable' },
    network: firstNetwork ? {
      ...baseline.network,
      name: firstNetwork.name,
      band: firstNetwork.mediaType ?? 'Connected',
      linkSpeedMbps: firstNetwork.linkSpeedBps ? firstNetwork.linkSpeedBps / 1_000_000 : 0,
      lanName: firstNetwork.interfaceName ?? firstNetwork.name,
    } : baseline.network,
    networks: mappedNetworks,
    connectedDevices: {
      display: connectedDisplays,
      input: connectedInputs,
      audio: connectedAudio,
    },
    peripherals: [...connectedDisplays, ...connectedInputs, ...connectedAudio].map((device) => ({
      id: device.localId,
      name: device.name,
      type: device.type,
      spec: device.manufacturer ?? 'Detected by Windows',
      detail: device.deviceStatus ?? 'Present',
      icon: device.type === 'display' ? 'tv' : device.type === 'audio' ? 'headphones' : device.type,
      active: true,
    })),
  }
}
